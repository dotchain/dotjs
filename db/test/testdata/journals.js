export default {
  format: "journal_suite",
  test: {
    simple1: {
      journal: [
        ["s0", "", "", "abc(=X)d"],
        ["s1", "s0", "", "a(b=Y)cXd"],
        ["c0", "", "", "a(=x)bcd"],
        ["c1", "", "c0", "axb(c=y)d"]
      ],
      rebased: ["abc(=X)d", "a(b=Y)cXd", "a(=x)YcXd", "axY(c=y)Xd"],
      mergeChains: [
        [],
        [],
        ["axbc(=X)d", "ax(b=Y)cXd"],
        ["axby(=X)d", "ax(b=Y)yXd"]
      ]
    },
    simple2: {
      journal: [
        ["s0", "", "", "a(=x)bcd"],
        ["s1", "s0", "", "axb(c=y)d"],
        ["c0", "", "", "abc(=X)d"],
        ["c1", "", "c0", "a(b=Y)cXd"]
      ],
      rebased: ["a(=x)bcd", "axb(c=y)d", "axby(=X)d", "ax(b=Y)yXd"],
      mergeChains: [
        [],
        [],
        ["a(=x)bcXd", "axb(c=y)Xd"],
        ["a(=x)YcXd", "axY(c=y)Xd"]
      ]
    },
    simple3: {
      journal: [
        ["s0", "", "", "a(b=xy)c"],
        ["s1", "s0", "", "(ax=)yc"],
        ["c0", "", "", "a(b=XY)c"],
        ["c1", "", "c0", "aX(Yc=)"]
      ],
      rebased: ["a(b=xy)c", "(ax=)yc", "", "y(c=)"],
      mergeChains: [[], [], ["a(XY=xy)c", "(ax=)yc"], ["a(X=xy)", "(ax=)y"]]
    },
    "staggered basis": {
      journal: [
        ["s0", "", "", "(=hello world)"],
        ["s1", "s0", "", "hello (=beautiful )world"],
        ["c0", "s0", "", "hello (=crazy )world"],
        ["x0", "s0", "", "hello world(=!)"],
        ["c1", "s1", "c0", "hello beautiful cra(z=)y world"]
      ],
      rebased: [
        "(=hello world)",
        "hello (=beautiful )world",
        "hello beautiful (=crazy )world",
        "hello beautiful crazy world(=!)",
        "hello beautiful cra(z=)y world!"
      ],
      mergeChains: [
        [],
        [],
        ["hello (=beautiful )crazy world"],
        ["hello (=beautiful )world!", "hello beautiful (=crazy )world!"],
        ["hello beautiful cray world(=!)"]
      ]
    }
  }
};
