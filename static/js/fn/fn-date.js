Date.prototype.format = function(f, input){
	var weekday = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
	var d = this;
	if(input){
		d = new Date(input);
	}
	if(!d.valueOf()){
		return " ";
	}
	var now = new Date();
	return f.replace(/(yyyy|YY|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function(token){
		switch(token){
			case "yyyy": return d.getFullYear();
			case "YY": return d.getFullYear().toString().slice(-2);
			case "yy": return now.getFullYear()===d.getFullYear() ? '' : d.getFullYear().toString().slice(-2);
			case "MM": return d.getMonth()+1;
			case "dd": return d.getDate();
			case "E": return weekday[d.getDay()];
			case "hh": return d.getHours();
			case "mm": return d.getMinutes()<10 ? '0'+d.getMinutes() : d.getMinutes();
			case "ss": return d.getSeconds();
			case "a/p": return d.getHours()<12 ? "오전" : "오후";
			default : return token;
		}
	})
}