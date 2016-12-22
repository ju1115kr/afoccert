Function.prototype.inherits = function(parent){
    this.prototype = Object.create(parent.prototype);
}

function CNote(obj){
}
CNote.prototype.init = function(obj){
    for(var key in obj){
        this[key] = obj[key];
    }
};
CNote.prototype.update = function(obj){
    for(var key in obj){
        if(this[key]!=obj[key])
            this[key] = obj[key];
    }
};

function CNews(obj){
    this.type = 'news';
    this.init(obj);
    serializer(this, 'context', 'text');
    this.created = {};
    this.created.date = new Date().format('YY년 MM월 dd일', obj.created_at);
    this.created.time = new Date().format('hh:mm', obj.created_at);
}

function CComment(obj){
    this.type = 'comment';
    this.init(obj);
    serializer(this, 'context', 'text');
    this.created = {};
    this.created.date = new Date().format('YY년 MM월 dd일', obj.created_at);
    this.created.time = new Date().format('hh:mm', obj.created_at);
}

function CReply(obj){
    this.type = 'reply';
    this.init(obj);
    serializer(this, 'context', 'text');
    this.created = {};
    this.created.date = new Date().format('YY년 MM월 dd일', obj.created_at);
    this.created.time = new Date().format('hh:mm', obj.created_at);
}

function CIssue(obj){
    this.type = 'issue';
    this.init(obj);
    serializer(this, 'context', 'text');
    this.created = {};
    this.created.date = new Date().format('YY년 MM월 dd일', obj.created_at);
    this.created.time = new Date().format('hh:mm', obj.created_at);
}
CNews.inherits(CNote);
CComment.inherits(CNote);
CReply.inherits(CNote);
CIssue.inherits(CNote);
