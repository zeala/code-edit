this.Documents = new Mongo.Collection("documents");
EditingUsers = new Mongo.Collection("editingUsers");

if (Meteor.isClient) {

  Template.editor.helpers({
    docid: function(){
      if (Documents.findOne()){

        return Documents.findOne()._id;
      }
      return undefined;
    },

    config: function(){
      return function(editor){
        console.log(editor);
        editor.setOption("lineNumbers", true);
        editor.setOption("mode", "html");
        editor.on("change", function(cm_editor, info){
          console.log(cm_editor.getValue());
          $("#viewer_iframe").contents().find("html").html(cm_editor.getValue());
          Meteor.call("addEditingUsers");
        })
      }
    }
  })
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup

    if (!Documents.findOne()){
      Documents.insert({title:"my new document"});
    }

  });
}

Meteor.methods({
  addEditingUsers:function(){
    var doc, user, eusers;
    doc = Documents.findOne();
    if (!doc) { return;} //no doc
    if (!this.userId){ return;} // no logged in user

    user = Meteor.user().profile;
    eusers = EditingUsers.findOne({docid: doc._id});

    if (!eusers){
      eusers = {
        docid: doc._id,
        users: {},
      };
    }

    user.lastEdit = new Date();
    eusers.users[this.userId] = user;

    EditingUsers.upsert({_id:eusers._id}, eusers);
  }
});
