var candidates_likes
var i = 0
var sorted_list
var meeting_sex = null
var user = "me()"

function begin(){
	// Adds sex validation
	FB.api({
		method: 'fql.query',
		query: 'SELECT meeting_sex FROM user WHERE uid=' + user
	}, function(response) {
		if(response.length > 0) {
			meeting_sex = response[0].meeting_sex[0]
		}
	});

	// Or creates it if its missing...
	if(meeting_sex == null){
		var sex
		FB.api({
			method: 'fql.query',
			query: 'SELECT sex FROM user WHERE uid=' + user
		}, function(response) {
			sex = response.sex
		});
		if(sex == 'male'){
			meeting_sex = 'female'
		}else{
			meeting_sex = 'male'
		}

	}

	FB.api({
		method: 'fql.query',
		query: 'SELECT page_id FROM page_fan WHERE uid =' + user
	}, function(response) {
		my_likes = response
		FB.api({
			method: 'fql.query',
			query: "SELECT uid,profile_url,relationship_status,pic_big,name" + " FROM user WHERE sex='" + meeting_sex + "'" + " AND relationship_status != 'In a relationship'" + " AND relationship_status != 'Married'" + " AND uid IN (SELECT uid2 FROM friend WHERE uid1 = " + user + ")"
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
					prc = Math.round((i/candidates_list.length)*100) + "%"
					console.log(prc)
					$("#title").html("Loading... " + prc)
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
	show_results();
}

function build_results(){
	line = ""
	i = 1

	line = '<div class="row">'
	sorted_list.slice(0,3).forEach(function(candidate){
		line += '<div class="col-sm-6 col-md-4">'
		line += '	<div class="thumbnail">'
		line += '      <img alt="300x200" style="width: 300px;height: 200px;" class="result_img" src="'+ candidate.pic_big +'">'
		line += '		 <div class="caption">'
		line += '			<p>'+ i + '.</p>'
		line += '		 <h5><a style="color: #C0392B;text-decoration: none;" href="' + candidate.profile_url + '">' + candidate.name + '</a></h5>'
		line += '			<p>Flirtrate: ' + Math.round((candidate.flirtrate)*100) + '%</p>'
		line += '		 </div>'
		line += '	</div>'
		line += '</div>'
		i++;
	});
    return line;
}


function show_results(){
	$("#description").hide();
	$("#sharecontrols").show();
	$("#results").attr("style","");
	$("#title").html("Results");
	$("#results").html(build_results());
}


