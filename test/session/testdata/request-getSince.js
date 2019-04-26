export default {
  url: "some url",
  opts: {
    method: "POST",
    body: {
      "ops/nw.request": ["GetSince", [], 10, 1000, 30000000000]
    },
    headers: {
      "Content-Type": " application/x-sjson"
    }
  }
};
