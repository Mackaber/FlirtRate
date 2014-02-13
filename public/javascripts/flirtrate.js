var candidates_likes
var i = 0
var sorted_list

function begin(){
	FB.api({
		method: 'fql.query',
		query: 'SELECT page_id FROM page_fan WHERE uid = me()'
	}, function(response) {
		my_likes = response
		FB.api({
			method: 'fql.query',
			query: "SELECT uid,profile_url,relationship_status,pic_big,name" + " FROM user WHERE sex='female'" + " AND relationship_status != 'In a relationship'" + " AND relationship_status != 'Married'" + " AND uid IN (SELECT uid2 FROM friend WHERE uid1 = me())"
		}, function(response) {
			candidates_list = response
			candidates_likes = []
			candidates_list.forEach(function(c) {
				FB.api({
					method: 'fql.query',
					query: "SELECT page_id FROM page_fan WHERE uid =" + c["uid"] + " AND profile_section != 'other' AND profile_section != 'apps'"
				}, function(response) {
					var candidate = {}
					window.likes = null
					candidate["uid"] = c["uid"]
					candidate["name"] = c["name"]
					candidate["profile_url"] = c["profile_url"]
					candidate["pic_big"] = c["pic_big"]
					candidate["likes"] = response
					candidate["flirtrate"] = 0
					candidate["coincidences"] = 0
					candidates_likes.push(candidate);	
					i++
					console.log(Math.round((i/candidates_list.length)*100) + "%")
					if(i == candidates_list.length){
						done();
					}
				});
			});
		});
	});
}

// FROM http://stackoverflow.com/questions/979256/sorting-an-array-of-javascript-objects
var sort_by = function(field, reverse, primer){

   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = [-1, 1][+!!reverse];

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 

}

function done() {
	candidates_likes.forEach(function(candidate_likes) {
		my_likes.forEach(function(my_like) {
			// Check if my_like are in the likes list
			if ((candidate_likes["likes"].filter(function(like) { return like.page_id == my_like.page_id}).length) > 0) {
				console.log("lol")
				candidate_likes.coincidences++
				candidate_likes.flirtrate = candidate_likes["coincidences"] / candidate_likes["likes"].length
			}
		});
	});
	console.log("done!")
	sorted_list = candidates_likes.sort(sort_by('flirtrate', false, null));
}

