const Symbiotic = require('symbiotic');

let symbiote = new Symbiotic({
  '.js-body': function () {
    console.log('success')
  }
}).attach('.js-body')