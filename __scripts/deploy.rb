#!/usr/bin/ruby
#
# a script to deploy the script to the live site

require 'fileutils'
require 'open3'
require 'optparse'
require 'pp'

root_dir = File.dirname(__dir__) # our directory should be __scripts, so the dirname of that is our root

now = Time.now

# get option values from the command line

$options = {
	build: true,
	verbose: false,
	target: 'tensegne@tenseg.net:/home2/tensegne/public_html/subcalc',
}

usage = OptionParser.new do |opts|
	
	opts.banner = "Usage: #{__FILE__} [-n] [-v] [-t <TARGET>]"
  
	opts.on( "--no-build", "Do not rebuild the site with 'yarn build'") do |flag|
		$options[:build] = flag
	end
	
	opts.on( "-v", "--verbose", "Say more") do |flag|
		$options[:verbose] = true
	end
	
	opts.on( "-t", "--target [TARGET]", "Choose a target other than #{$options[:target]}") do |target|
		$options[:target] = target
	end
			
end
  
begin usage.parse!
rescue OptionParser::InvalidOption => error
	puts error
	puts usage
	exit 1
end

Dir.chdir "#{root_dir}"

if $options[:build]
	build = "/usr/local/bin/yarn build"
	puts build
	result, status = Open3.capture2e(build)
	if $options[:verbose] then puts result end
	if status.exitstatus != 0 then exit status.exitstatus end
end

# now rsync over to that local aws copy
# -v increase verbosity (for the log)
# -r recurse into directories
# --delete remove files that are gone in the source
rsync = "/usr/bin/rsync -vr --delete --exclude \"/.well-known\" --exclude \"/.htaccess\" \"#{root_dir}/build/\" \"#{$options[:target]}\""
puts rsync
result, status = Open3.capture2e(rsync)
if $options[:verbose] then puts result end
exit status.exitstatus

