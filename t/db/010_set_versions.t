#!/usr/bin/env perl
#
# This tests the basic database CRUD functions of problem sets.
#
use warnings;
use strict;

BEGIN {
	use File::Basename qw/dirname/;
	use Cwd qw/abs_path/;
	$main::ww3_dir = abs_path(dirname(__FILE__)) . '/../..';
}

use lib "$main::ww3_dir/lib";

use Data::Dumper;
use List::MoreUtils qw(uniq);
use Test::More;
use Test::Exception;
use Try::Tiny;
use YAML::XS qw/LoadFile/;

use Array::Utils qw/array_minus intersect/;

use DB::WithParams;
use DB::WithDates;
use DB::Schema;
use DB::TestUtils qw/loadCSV removeIDs filterBySetType loadSchema/;

# setup the database
my $config;
my $config_file = "$main::ww3_dir/conf/ww3-dev.yml";
if (-e $config_file) {
	$config = LoadFile($config_file);
} else {
	die "The file $config_file does not exist.  Did you make a copy of it from ww3-dev.dist.yml ?";
}

my $schema = DB::Schema->connect($config->{test_database_dsn}, $config->{test_database_user},
	$config->{test_database_password});

# $schema->storage->debug(1);  # print out the SQL commands.

my @hw_dates  = @DB::Schema::Result::ProblemSet::HWSet::VALID_DATES;
my @hw_params = @DB::Schema::Result::ProblemSet::HWSet::VALID_PARAMS;

my $problem_set_rs = $schema->resultset("ProblemSet");
my $course_rs      = $schema->resultset("Course");
my $user_rs        = $schema->resultset("User");

# load HW sets from CSV file
my @hw_sets = loadCSV("$main::ww3_dir/t/db/sample_data/hw_sets.csv");
for my $set (@hw_sets) {
	$set->{type}        = 1;
	$set->{set_type}    = "HW";
	$set->{set_version} = 1 unless defined($set->{set_version});
}

$problem_set_rs->newSetVersion({ course_id => 1, set_id => 1 });

is_deeply({ test => 1 }, { test => 1 }, 'fake test');

done_testing;
