export default {
  url: "some url",
  opts: {
    method: "POST",
    body: {
      "ops/nw.request": [
        "Append",
        [
          {
            "ops.Operation": [
              {
                string: "id"
              },
              {
                string: "parentId"
              },
              10,
              100,
              {
                "changes.Replace": [
                  {
                    "dotdb.Text": "1"
                  },
                  {
                    "dotdb.Text": "2"
                  }
                ]
              }
            ]
          },
          {
            "ops.Operation": [
              {
                string: "id2"
              },
              {
                string: "parentId2"
              },
              11,
              101,
              {
                "changes.Replace": [
                  {
                    "dotdb.Text": "1"
                  },
                  {
                    "dotdb.Text": "2"
                  }
                ]
              }
            ]
          }
        ],
        -1,
        -1,
        0
      ]
    },
    headers: {
      "Content-Type": " application/x-sjson"
    }
  }
};
