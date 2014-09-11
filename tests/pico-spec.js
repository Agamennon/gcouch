

var gcouch = require('../src/gcouch.js')('localhost','5984','admin','123');


describe("gcouch [Server API] Testes", function () {

    function semErro(self,erro){
        if (erro){
            self.fail(Error(JSON.stringify(erro)));
            return false;
        }else
            return true;
    }

    it('deve criar um db', function (done) {
        gcouch.create('gcouchtest',function(erro,data){
            if (semErro(this,erro))
                expect(data.ok).toBe(true);
            done();
        }.bind(this));
    });

    it('deve obter informaçoes sobre um db', function (done) {
        gcouch.get('gcouchtest',function(erro,data){
            if (semErro(this,erro))
                expect(data.db_name).toBe('gcouchtest');
            done();
        }.bind(this));
    });



    it('deve obter uma lista de todos os dbs', function (done) {
        gcouch.list(function(erro,data){
            if (semErro(this,erro))
                expect(data.indexOf('gcouchtest')).toBeGreaterThan(-1);
            done();
        }.bind(this));
    });

    describe('gcouch [Database API] Testes', function(){
        var db = gcouch.use('gcouchtest'),
            doc = {
                _id:'teste01',
                nome:'gui',
                numero:'91017001'
            },

            doc2 = {
                _id:'teste02',
                nome:'mauro',
                tipo:'teste',
                numero:'1341017001'
            },

            doc3 = {
                nome:'maria',
                tipo:'teste',
                numero:'30252957'
            };

        it('deve inserir um documento', function (done) {
            db.save(doc,function(erro,data){
                if (semErro(this,erro))
                    expect(data.ok).toBe(true);
                done();
            }.bind(this));
        });

        it('deve inserir outro documento', function (done) {
            db.save(doc2,function(erro,data){
                if (semErro(this,erro))
                    expect(data.ok).toBe(true);
                done();
            }.bind(this));
        });

        it('deve inserir um documento sem ID usando POST', function (done) {

            db.save(doc3,function(erro,data){
                if (semErro(this,erro))
                    expect(data.ok).toBe(true);
                done();
            }.bind(this));
        });


        it('deve buscar um documento', function (done) {
            db.get('teste01',function(erro,data){
                if (semErro(this,erro)){
                    doc = data;
                    expect(data._id).toBe('teste01');
                }
                done();
            }.bind(this));
        });


        it('deve alterar um documento usando PUT', function (done) {
            doc.nome = 'leo';
            db.save(doc,function(erro,data){
                if (semErro(this,erro))
                    expect(data.ok).toBe(true);
                done();
            }.bind(this));
        });

        it('deve pegar informacoes sobre um documento HEAD', function (done) {
            db.head('teste01',function(erro,data){
                if (semErro(this,erro)){
                    doc._rev = data.etag;
                    expect(data.etag).toBeDefined();
                }
                done();
            }.bind(this));
        });


        it('deve buscar todos os documentos do array BULK get', function (done) {
            db.bget(['teste01','teste02'],{},function(erro,data){
                if (semErro(this,erro)){
                    expect(data[0]._id).toBe('teste01');
                }
                done();
            }.bind(this));
        });

        it('deve inserir/atualizar todos os documentos do array BULK update', function (done) {
            var bdoc = {
                    _id:'bdoc01',
                    nome:'ana',
                    tipo:'teste2',
                    numero:'31017001'
                },

                bdoc2 = {
                    _id:'bdoc02',
                    nome:'thiago',
                    tipo:'teste2',
                    numero:'34343234'
                };
            db.bsave([bdoc,bdoc2],{},function(erro,data){
                if (semErro(this,erro)){
                    expect(data.length).toBe(2);
                }
                done();
            }.bind(this));
        });


        it('deve deletar um documento', function (done) {
            db.del(doc,function(erro,data){
                if (semErro(this,erro)){
                    expect(data.ok).toBe(true);
                }
                done();
            }.bind(this));
        });

        var attachRev;
        it('deve inserir um documento e todos os seus attachements MULTIPART', function (done) {
            var doc1 = new Buffer('documento primeiro attachement 1'),
                doc2 = new Buffer('documento segundo attachement 2'),
                all = [];

            var docm = {
                _id : 'attach01',
                nome : 'superdoc',
                tipo:'att'
            };

            all.push(docm);
            all.push({name:'doc1.txt',data:doc1});
            all.push({name:'doc2.txt',data:doc2});


            db.attachment.multiSave(all,{},function(erro,data){
                if (semErro(this,erro)){
                    attachRev = data.rev;
                    expect(data.ok).toBe(true);
                }
                done();
            }.bind(this));

        });
        it('deve buscar um documento e todos os seus attachements MULTIPART', function (done) {
            db.attachment.multiGet('attach01','',function(erro,data){

                if (semErro(this,erro)){
                    expect(data.data).toBeDefined();
                }
                done();
            }.bind(this));

        });

        it('deve downlodar um attachement de um documento', function (done) {
            db.attachment.get('attach01','doc1.txt',function(erro,data){
                if (semErro(this,erro)){
                    expect(data).toBeDefined();
                }
                done();
            }.bind(this));

            //PIPE TESTS
            /*  var fs = require('fs');
             fs.unlink(__dirname +'/docstream1.txt', function (err) {
             db.getAttachment('attach01','doc1.txt').pipe(fs.createWriteStream(__dirname +'/docstream1.txt'));
             done();
             });*/

        });

        it('deve deletar um attachement de um documento', function (done) {
            db.attachment.delete('attach01','doc1.txt',attachRev,function(erro,data){
                if (semErro(this,erro)){
                    expect(data.ok).toBe(true);
                }
                done();
            }.bind(this));
        });

        var gcouchDesign = {
            _id: '_design/gcouchtest',
            language: 'javascript',
            views : {
                'tipo': {
                    map: function (doc) {
                        if (doc.tipo === 'teste' || doc.tipo === 'teste2') {
                            emit([doc.nome],doc._id);
                        }
                    }.toString()
                }
            },
            updates : {
                'contadores': function (doc,req){
                    var res = {
                        ok:true,
                        doc:doc
                    };
                    doc.vai = 'aaaasaa vai vai vai';
                    return [doc,  JSON.stringify(res)];
                }.toString()
            },
            lists :{
                "busca" : function(head, req) {
                    var row,resultRows = [];
                    while(row = getRow()) {
                        resultRows.push(row);
                    }
                    send(JSON.stringify({"rows": resultRows,"debug":{"head":head,"req":req}}));
                }.toString()
            }
        };

        it('deve inserir um designDoc', function (done) {
            db.design.save(gcouchDesign,function(erro,data){
                if (semErro(this,erro)){
                    gcouchDesign._rev = data.rev;
                    expect(data.ok).toBe(true);
                }
                done();
            }.bind(this));
        });

        it('deve buscar um designDoc', function (done) {
            db.design.get(gcouchDesign._id,function(erro,data){
                if (semErro(this,erro)){
                    expect(data._id).toBe('_design/gcouchtest');
                }
                done();
            }.bind(this));
        });

        it('deve deletar um designDoc', function (done) {
            db.design.delete(gcouchDesign,function(erro,data){
                if (semErro(this,erro)){
                    expect(data.ok).toBe(true);
                }
                done();
            }.bind(this));
        });

        it('deve atualizar um designDoc (novo)', function (done) {
            delete gcouchDesign._rev;

            db.design.update(gcouchDesign,function(erro,data){
                if (semErro(this,erro)){
                    expect(data.ok).toBe('new');
                }
                done();
            }.bind(this));
        });

        it('deve atualizar um designDoc (ja atualizado)', function (done) {

            db.design.update(gcouchDesign,function(erro,data){
                if (semErro(this,erro)){
                    expect(data.ok).toBe('same');
                }
                done();
            }.bind(this));
        });

        it('deve atualizar um designDoc (update)', function (done) {
            gcouchDesign.some = 'some new design stuff';
            db.design.update(gcouchDesign,function(erro,data){
                if (semErro(this,erro)){
                    expect(data.ok).toBe('updated');
                }
                done();
            }.bind(this));
        });


        it('deve buscar uma view', function (done) {
            var cfg = {},
                qs = {};

            cfg.viewName = 'tipo';
            qs.startkey = ['ana'];
            qs.endkey = ['mauro'];
            qs.include_docs = true;
            cfg.qs = qs;

            db.view(cfg,function(erro,data){
                if (semErro(this,erro)){
                    expect(data.rows[0].key[0]).toBe('ana');
                }
                done();
            }.bind(this));
        });

        it('deve executar uma list em uma view', function (done) {
            var cfg = {},
                qs = {};
            cfg.viewName = 'tipo';
            cfg.listName = 'busca';
            qs.startkey = ['ana'];
            qs.endkey = ['mauro'];
            cfg.qs = qs;
            cfg.data = {hello:'gui'};
            db.list(cfg,function(erro,data){
                if (semErro(this,erro)){
                    expect(data.rows[0].key[0]).toBe('ana');
                }
                done();
            }.bind(this));
        });


        it('deve executar um update function', function (done) {
            var cfg = {};
            cfg.updateName = 'contadores';
            cfg._id = 'teste02';
            db.update(cfg,function(erro,data){
                if (semErro(this,erro)){

                    expect(data.ok).toBe(true);
                }
                done();
            }.bind(this));

        });

    });


    it('deve replicar um db', function (done) {
        var data = {};
        data.source = "http://admin:123@localhost:5984/gcouchtest";
        data.target = "http://admin:123@localhost:5984/gcouchreplicated";
        data.continuous = false;
        data.create_target = true;


        gcouch.replicate(data,function(erro,data){
            if (semErro(this,erro)){
                expect(data.ok).toBe(true);
            }
            done();
        }.bind(this));

    });


    it('deve ver active tasks', function (done) {

        gcouch.activeTasks(function(erro,data){
            if (semErro(this,erro))
                expect(erro).toBe(null);
            done();
        }.bind(this));

    });


    it('deve deletar um db', function (done) {

        gcouch.delete('gcouchtest',function(erro,data){
            if (semErro(this,erro))
                expect(data.ok).toBe(true);
            done();
        }.bind(this));

    });

    it('deve deletar o db replicado ', function (done) {

        gcouch.delete('gcouchreplicated',function(erro,data){
            if (semErro(this,erro))
                expect(data.ok).toBe(true);
            done();
        }.bind(this));

    });

});
