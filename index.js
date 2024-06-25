const data = require("./data.json");
let { context, fetch: fetch2, disconnect } = require("fetch-h2");
const { get } = require("http2-client");

if (0) {
  const ctx = context({
    httpProtocol: "http1",
    http1: { maxSockets: 6 },
  });
  fetch2 = ctx.fetch;
  disconnect = ctx.disconnect;
}

require("events").EventEmitter.setMaxListeners(0);

const arg = process.argv?.[2];

function getReq(url) {
  return new Promise((resolve, reject) => {
    get(url, (stream) => {
      console.log("url");
      var chunks = [];

      stream.on("error", function (e) {
        reject(e);
      });

      stream.on("data", function (chunk) {
        chunks.push(chunk);
      });

      stream.on("end", function () {
        // Here is your body
        var body = Buffer.concat(chunks);

        resolve({
          text: function () {
            return body.toString();
          },
        });

        // Not sure if useful
        chunks = [];
      });
    });
  });
}

let success = 0;
let fail = 0;

function req(url) {
  return fetch2(url)
    .then(async (res) => {
      const path = url.split("/");
      if (res.status >= 500) {
        console.error(
          arg,
          path[path.length - 1],
          `invalid http status: ${res.status}`
        );
        fail++;
      } else {
        try {
          const text = await res.text();
          if (text.length < 1000 && !/weda-private.js/.test(url)) {
            console.error(
              arg,
              path[path.length - 1],
              `body too small: ${res.status} ${text.length}`,
              text
            );
            fail++;
          } else {
            success++;
          }
        } catch (e) {
          fail++;
          throw new Error(`to text error: ${path}, message:${e.message}`);
        }
      }
      return url;
    })
    .catch((e) => {
      fail++;
      console.error(e);
      return url;
    });
}

async function run() {
  while (true) {
    for (const url of Object.values(data).slice(0, 2)) {
      await req(url);
      // console.log(res);
    }
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });
    // console.log(current);
    // current.end();
  }
  //   process.exit(0);
}

async function runParallel() {
  setInterval(() => {
    console.log(
      arg,
      `fail: ${fail} success:${success} rate: ${(
        fail /
        (success + fail)
      ).toFixed(2)}`
    );
  }, 10000);
  while (true) {
    try {
      const res = await Promise.all(
        Object.values(data)
          .slice(0, 2)
          .map((url) => req(url))
      );
      disconnect(res[0]);
    } catch (e) {
      console.log(e);
    }
  }
}

runParallel();

process.on("error", console.error);
process.on("unhandledRejection", console.error);
