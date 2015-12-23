this.Documents = new Mongo.Collection("documents");
EditingUsers = new Mongo.Collection("editingUsers");

if (Meteor.isClient) {

  Meteor.subscribe("documents");
  Meteor.subscribe("editingUsers");

  Template.editor.helpers({
    docid: function(){
      setupCurrentDocument();
      return Session.get("docid");
    },

    config: function(){
      return function(editor){
        console.log(editor);
        editor.setOption("lineNumbers", true);
        editor.setOption("mode", "html");
        editor.setOption("theme", "cobalt")
        editor.on("change", function(cm_editor, info){
          console.log(cm_editor.getValue());
          $("#viewer_iframe").contents().find("html").html(cm_editor.getValue());
          Meteor.call("addEditingUsers");
        })
      }
    }
  });

  Template.editingUsers.helpers({
      users: function(){
        var users;
        var doc;

        doc = Documents.findOne();
        if (!doc){ return;}
        eusers = EditingUsers.findOne({docid: doc._id});

        if (!eusers){ return};

        users = new Array();
        var i = 0
        for (var user_id in eusers.users){
          users[i] = fixObjectKeys(eusers.users[user_id]);
          i++;
        }
        return users;
      }
  });

  Template.navbar.helpers({
    documents: function(){
      return Documents.find()
    }
  });

  Template.docMeta.helpers({
    document:function(){
      return Documents.findOne({_id:Session.get("docid")})
    },
     canEdit:function(){
       var doc;
       doc = Documents.findOne({_id:Session.get("docid")});
       if (doc){
         if (doc.owner == Meteor.userId){
           return true;
         }
       }
       return false;
     }
  });

  Template.editableText.helpers({
    userCanEdit: function(doc, Collection){
    doc = Documents.findOne({_id:Session.get("docid"), owner: Meteor.userId()});
      if (doc){
        return true;
      }
      else{
        return false;
      }
    }
  });

  //-------------------------------------------------------//
  //                EVENTS
  //-------------------------------------------------------//
    Template.docMeta.events({
      "click .js-tog-private": function(event){
        console.log(event.target.checked);

        var doc = {_id: Session.get("docid"), isPrivate: event.target.checked};
        Meteor.call("updateDocPrivacy", doc);
      }
    });

    Template.navbar.events({
      "click .js-add-doc": function(event){
        event.preventDefault();
        console.log("add new doc");

        if (!Meteor.user()){
          alert("You need to login first");
        }
        else{
          //user is logged in
          var id =  Meteor.call("addDoc", function(error, result){
            if (error) { return }
            console.log(" got an id from async call : " + result);
            Session.set("docid", result);
          });
        }
      },
      "click .js-load-doc": function(event){
        Session.set("docid", this._id)
      }
    });
}



if (Meteor.isServer) {
  Meteor.publish("documents", function(){
    return Documents.find({
      $or: [
        {isPrivate:false},
        {owner: this.userId}
    ]});
  });

  Meteor.publish("editingUsers", function(){
    return EditingUsers.find();
  });

  Meteor.startup(function () {
    // code to run on server at startup

    if (!Documents.findOne()){
      Documents.insert({title:"my new document"});
    }

  });
};


Meteor.methods({
  updateDocPrivacy: function(doc){
    console.log("update doc privacy method");
    console.log(doc);
    var realDoc = Documents.findOne({_id:doc._id, owner: this.userId});
    if(realDoc){
      realDoc.isPrivate = doc.isPrivate;
      Documents.update({_id:realDoc._id}, realDoc);
    }
  },

  addDoc:function(){
    var doc;
    if (!this.userId){
      return;
    }
    else{
      doc = {owner: this.userId, createdOn: new Date(), title: "my new doc"};
      var id = Documents.insert(doc);
      console.log("add doc method: " + id);
      return id;
    }
  },
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


//------------------------------------------------//
//          helper methods
//------------------------------------------------//

function setupCurrentDocument(){
  var doc;
  if (!Session.get("docid")){
    doc = Documents.findOne();
    if (doc){
      Session.set("docid", doc._id);
    }
  }
}

function fixObjectKeys(obj){
  var newObj = {};

  for (key in obj){
    var key2 = key.replace("-", "");
    newObj[key2] = obj[key];
  }

  return newObj;
}

