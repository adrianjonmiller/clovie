const Symbiotic = require('symbiotic');

let symbiote = new Symbiotic({
  methods: {
    ".js-body": function() {
      console.log("best");
      console.log('test')
    }
  }
}).attach();