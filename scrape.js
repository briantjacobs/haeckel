var nodeio = require('node.io'), options = {timeout: 10};


var pageUrlBase;
var taxonUrlBase;
var count = 0

exports.job = new nodeio.Job(options, {
    input: 'data/haeckel-plates.csv',
    run: function(input) {
        var self = this;

        if (!input.type) {
            var values = this.parseValues(input);
            var keyword = values[2]; // hardcoded csv column

            this.get('http://eol.org/api/search/1.0.json?q='+encodeURIComponent(keyword)+'&page=1&exact=true', function(err, data, headers) {
                console.log(keyword, err, count++);
                var json = JSON.parse(data); //('#resultStats').text.toLowerCase();

                if (json.results[0] === undefined) {
                    var output = JSON.stringify({name: keyword, errorType: 'noPage'})+',';
                    this.emit(output);
                } else {
                    self.add({ type: 'pageRequest', id: json.results[0].id});
                    this.skip();
                }
            });

        }
        else if (input.type == 'pageRequest') {
            this.get('http://eol.org/api/pages/1.0/'+input.id+'.json?images=2&videos=0&sounds=0&maps=0&text=2&iucn=false&subjects=overview&licenses=all&details=false&common_names=true&references=false&vetted=1', function(err, data, headers) {

                var json = JSON.parse(data);
                var taxonMember;

                if (json.taxonConcepts[0] === undefined) {
                    var output = JSON.stringify({name: input.id, errorType: 'noTaxa'})+',';
                    this.emit(output);
                } else {
                    json.taxonConcepts.forEach(function(item){
                        if (item.nameAccordingTo == 'Integrated Taxonomic Information System (ITIS)') {
                            self.add({ type: 'taxonRequest', id: item.identifier});
                            taxonMember = 'yes';
                        }
                    });
                    if (taxonMember == 'yes') {
                        this.skip();
                    } else {
                        newOutput = JSON.stringify({name: input.id, errorType: 'noTaxa-ITIS'})+',';
                        self.emit(newOutput);

                    }
                }

                
                
            });
        }

        else if (input.type == 'taxonRequest') {
            this.get('http://eol.org/api/hierarchy_entries/1.0/'+input.id+'.json?common_names=false&synonyms=false', function(err, data, headers) {
                //var json = JSON.parse(data);
                var output = data+','; //add trailing comma for json
                this.emit(output);
            });
        }

    },
    output: 'output.json'
});



// exports.job = new nodeio.Job(options, {
//     input: 'data/haeckel-plates.csv',
//     run: function (row) {
//         var values = this.parseValues(row);
//         var keyword = values[2]; // hardcoded csv column

//         this.get('http://eol.org/api/search/1.0.json?q='+encodeURIComponent(keyword)+'&page=1&exact=true', function(err, data, headers) {
//             var json = JSON.parse(data); //('#resultStats').text.toLowerCase();
//             this.emit(json);
//             //this.emit(keyword + ' has ' + json.results[0].id);
//         });
//     },
//     reduce: function(data) {
             
//             var result = data[0].results[0]

//             if (result == undefined) {
//                 //console.log('no')
//             } else {
//                 console.log(result.title + ': ' + result.id)
//             }


     
//     }
//   //  output: 'output.tsv'
// });







// GOOGLE RESULTS

// exports.job = new nodeio.Job(options, {
//     input: 'data/haeckel-plates.csv',
//  run: function (row) {
//      var values = this.parseValues(row);
//      var keyword = values[2]; // hardcoded csv column

//         this.getHtml('http://www.google.com/search?q=' + encodeURIComponent(keyword), function (err, $) {
//             var results = $('#resultStats').text.toLowerCase();
//             this.emit(keyword + ' has ' + results);
//         });

//  }
//   //  output: 'output.tsv'
// });