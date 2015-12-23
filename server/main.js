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

