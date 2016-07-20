/**
 * Created by cert on 2016-01-25.
 */

Object.defineProperty(
    Object.prototype,
    'renameKey',
    {
        writable :false,
        enumerable :false,
        configurable:false,
        value : function (oldKey, newKey){
            if(oldKey===newKey){
                return this;
            }else{
                if(this.hasOwnProperty(oldKey)){
                    this[newKey] = this[oldKey];
                    delete this[oldKey];
                }
                return this;
            }
        }
    }
)
function serializer(obj, oldKey, newKey){
    if(Array.isArray(obj)){
        obj.forEach(function(entry){
            serializer(entry, oldKey, newKey);
        })
    }else{
        if(typeof obj === "object"){
            obj.renameKey(oldKey,newKey);
        }
    }
}