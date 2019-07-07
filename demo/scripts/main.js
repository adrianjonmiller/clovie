const Symbiotic = require("symbiotic");

let symbiote = new Symbiotic({
  methods: {
    ".js-body": function() {
      console.log("jest");
    }
  }
}).attach();
