# Written by Mackaber
# Do Whatever you want with it
# Version 0.1

require "koala"
def calculate_rate(acces_token)
	@client = Koala::Facebook::API.new(acces_token)

	# Build my likes list
	@my_likes = @client.fql_query("SELECT page_id FROM page_fan WHERE uid = me()")

	# Build candidates likes list
	@candidates_list = @client.fql_query("SELECT uid ,relationship_status,  name FROM user WHERE sex='female' AND relationship_status != 'In a relationship' AND relationship_status != 'Married' AND uid IN (SELECT uid2 FROM friend WHERE uid1 = me())")
	@candidates = @candidates_list.to_a

	# # Deleting users in blacklist.json
	# print "Deleting users in blacklist.json..."
	# if File.readable?("blacklist.json")
	# 	f = File.read("blacklist.json")
	# 	@blacklist = JSON.parse(f)
	# 	@blacklist.each do |blacklist|
	# 		@candidates = @candidates.reject { |user| blacklist["uid"] == user["uid"] }
	# 	end
	# end
	# puts "done"

	@candidates_likes = Array.new
	@candidates.each do |c|
		@candidate = Hash.new
		@candidate[:uid] = c["uid"]
		@candidate[:name] = c["name"]
		@likes = @client.fql_query("SELECT page_id FROM page_fan WHERE uid = #{@candidate[:uid]} AND profile_section != 'other' AND profile_section != 'apps'")
		@candidate[:likes] = @likes

		@candidate[:coincidences] = 0
		@candidate[:flirtrate] = 0
		@candidates_likes.push(@candidate)
	end

	@candidates_likes.each do |candidate_likes|
		@my_likes.each do |my_like|
			if candidate_likes[:likes].to_s.include? my_like["page_id"].to_s
				candidate_likes[:coincidences] += 1
				candidate_likes[:flirtrate] = candidate_likes[:coincidences]/candidate_likes[:likes].count.to_f
			end
		end
	end

	@candidates_sorted = @candidates_likes.sort_by {|c| c[:flirtrate]}.reverse
	return @candidates_sorted
end


