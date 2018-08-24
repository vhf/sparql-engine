/* file : update-test.js
MIT License

Copyright (c) 2018 Thomas Minier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict'

const expect = require('chai').expect
const { getDB, LevelGraphEngine } = require('../utils.js')

describe('SPARQL UPDATE: INSERT/DELETE queries', () => {
  let engine = null
  beforeEach(done => {
    getDB('./tests/data/dblp.nt')
      .then(dbA => {
        engine = new LevelGraphEngine(dbA)
        done()
      })
  })

  afterEach(done => {
    engine._db.close(done)
  })

  it('should evaluate basic INSERT queries', done => {
    const query = `
    PREFIX dblp-pers: <https://dblp.org/pers/m/>
    PREFIX dblp-rdf: <https://dblp.uni-trier.de/rdf/schema-2017-04-18#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    INSERT { ?s  dc:name  "Thomas Minier"@en }
    WHERE {
      ?s rdf:type dblp-rdf:Person .
      ?s dblp-rdf:primaryFullPersonName ?name .
      ?s dblp-rdf:authorOf ?article .
    }`

    engine.execute(query)
      .execute()
      .then(() => {
        engine._db.get({ predicate: 'http://purl.org/dc/elements/1.1/name' }, (err, list) => {
          if (err) {
            done(err)
          } else {
            expect(list.length).to.equal(1)
            expect(list[0].subject).to.equal('https://dblp.org/pers/m/Minier:Thomas')
            expect(list[0].predicate).to.equal('http://purl.org/dc/elements/1.1/name')
            expect(list[0].object).to.equal('"Thomas Minier"@en')
            done()
          }
        })
      })
      .catch(done)
  })

  it('should evaluate basic DELETE queries', done => {
    const query = `
    PREFIX dblp-rdf: <https://dblp.uni-trier.de/rdf/schema-2017-04-18#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX dc: <http://purl.org/dc/elements/1.1/>
    DELETE { ?s  rdf:type dblp-rdf:Person . }
    WHERE {
      ?s rdf:type dblp-rdf:Person .
    }`

    engine.execute(query)
      .execute()
      .then(() => {
        setTimeout(() => {
          engine._db.get({ object: 'https://dblp.uni-trier.de/rdf/schema-2017-04-18#Person' }, (err, list) => {
            if (err) {
              done(err)
            } else {
              expect(list.length).to.equal(0)
              done()
            }
          })
        }, 300)
      })
      .catch(done)
  })
}).timeout(20000)