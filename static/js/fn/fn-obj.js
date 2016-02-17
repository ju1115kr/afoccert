Object.prototype.isEmptyObj = function(){
	if(this == null) return true;
	if(this.length > 0) return false;
	if(this.length === 0) return true;
	for(var key in this){
		if (Object.hasOwnProperty.call(this,key)) return false;
	}
	return true;
}