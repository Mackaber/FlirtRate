require "sinatra"
require 'koala'
require './flirtrate_module.rb'

enable :sessions
set :raise_errors, false
set :show_exceptions, false



# Scope defines what permissions that we are asking the user to grant.
# In this example, we are asking for the ability to publish stories
# about using the app, access to what the user likes, and to be able
# to use their pictures.  You should rewrite this scope with whatever
# permissions your app needs.
# See https://developers.facebook.com/docs/reference/api/permissions/
# for a full list of permissions
FACEBOOK_SCOPE = 'basic_info, friends_about_me, friends_actions.books, friends_actions.music, friends_actions.video, friends_activities, friends_birthday, friends_groups, friends_hometown, friends_interests, friends_likes, friends_location, friends_relationship_details, friends_relationships, friends_subscriptions, user_about_me, user_actions.music, user_activities, user_birthday, user_friends, user_hometown, user_interests, user_likes, user_location, user_photos, user_relationship_details, user_relationships'

unless ENV["FACEBOOK_APP_ID"] && ENV["FACEBOOK_SECRET"]
  abort("missing env vars: please set FACEBOOK_APP_ID and FACEBOOK_SECRET with your app credentials")
end

before do
  # HTTPS redirect
  if settings.environment == :production && request.scheme != 'https'
    redirect "https://#{request.env['HTTP_HOST']}"
  end
end

helpers do
  def host
    request.env['HTTP_HOST']
  end

  def scheme
    request.scheme
  end

  def url_no_scheme(path = '')
    "//#{host}#{path}"
  end

  def url(path = '')
    "#{scheme}://#{host}#{path}"
  end

  def authenticator
    @authenticator ||= Koala::Facebook::OAuth.new(ENV["FACEBOOK_APP_ID"], ENV["FACEBOOK_SECRET"], url("/auth/facebook/callback"))
  end

  # allow for javascript authentication
  def access_token_from_cookie
    authenticator.get_user_info_from_cookies(request.cookies)['access_token']
  rescue => err
    warn err.message
  end

  def access_token
    session[:access_token] || access_token_from_cookie
  end

end

# the facebook session expired! reset ours and restart the process
error(Koala::Facebook::APIError) do
  session[:access_token] = nil
  redirect "/auth/facebook"
end

get "/" do
  # Get base API Connection
  @graph  = Koala::Facebook::API.new(access_token)

  # Get public details of current application
  @app  =  @graph.get_object(ENV["FACEBOOK_APP_ID"])

  if access_token
    @user    = @graph.get_object("me")
    @friends = @graph.get_connections('me', 'friends')
    @photos  = @graph.get_connections('me', 'photos')
    @likes   = @graph.get_connections('me', 'likes').first(4)

    # for other data you can always run fql
    @friends_using_app = @graph.fql_query("SELECT uid, name, is_app_user, pic_square FROM user WHERE uid in (SELECT uid2 FROM friend WHERE uid1 = me()) AND is_app_user = 1")
  end
  erb :index
end

get "/calculate" do
    # Get base API Connection
  @graph  = Koala::Facebook::API.new(access_token)

    # Get public details of current application
  @app  =  @graph.get_object(ENV["FACEBOOK_APP_ID"])

  if access_token
    @candidates = calculate_rate(access_token)
  end
  erb :calculate
end

get "/disclamer" do
  erb :disclamer
end

get "/faq" do
  erb :faq
end

get "/about" do
  erb :about
end

# used by Canvas apps - redirect the POST to be a regular GET
post "/" do
  redirect "/"
end

# used to close the browser window opened to post to wall/send to friends
get "/close" do
  "<body onload='window.close();'/>"
end

# Doesn't actually sign out permanently, but good for testing
get "/preview/logged_out" do
  session[:access_token] = nil
  request.cookies.keys.each { |key, value| response.set_cookie(key, '') }
  redirect '/'
end


# Allows for direct oauth authentication
get "/auth/facebook" do
  session[:access_token] = nil
  redirect authenticator.url_for_oauth_code(:permissions => FACEBOOK_SCOPE)
end

get '/auth/facebook/callback' do
  session[:access_token] = authenticator.get_access_token(params[:code])
  redirect '/'
end
