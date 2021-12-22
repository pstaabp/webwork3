#!/usr/bin/env perl
#
# This tests the basic database CRUD functions of course users.
#
use warnings;
use strict;

BEGIN {
	use File::Basename qw/dirname/;
	use Cwd qw/abs_path/;
	$main::ww3_dir = abs_path(dirname(__FILE__)) . '/../..';
}

use lib "$main::ww3_dir/lib";

use Text::CSV qw/csv/;
use List::Util qw(uniq);
use Test::More;
use Test::Exception;
use Try::Tiny;
use YAML::XS qw/LoadFile/;
use Clone qw/clone/;

use DB::WithParams;
use DB::WithDates;
use DB::Schema;
use DB::TestUtils qw/loadCSV removeIDs loadSchema/;
use DB::Utils qw/removeLoginParams/;

my $config_file = "$main::ww3_dir/conf/ww3-dev.yml";
die "The file $config_file does not exist.  Did you make a copy of it from ww3-dev.dist.yml ?"
	unless (-e $config_file);

my $config = LoadFile($config_file);

my $schema =
	DB::Schema->connect($config->{database_dsn}, $config->{database_user}, $config->{database_password});

# $schema->storage->debug(1);  # print out the SQL commands.

my $course_rs      = $schema->resultset("Course");
my $user_rs        = $schema->resultset("User");
my $course_user_rs = $schema->resultset("CourseUser");

use Data::Dumper;

## get a list of users from the CSV file
my @students = loadCSV("$main::ww3_dir/t/db/sample_data/students.csv");
for my $student (@students) {
	$student->{is_admin} = 0;
	$student->{course_user_params} = $student->{params};
	delete $student->{params};
}

## filter only precalc students
my @precalc_students = grep { $_->{course_name} eq "Precalculus" } @students;
for my $student (@precalc_students) {
	delete $student->{course_name};
}
@precalc_students = sort { $a->{username} cmp $b->{username} } @precalc_students;

## get the course_id for Precalc

my $precalc = $course_rs->getCourse(info => { course_name => "Precalculus" });

## test getUsers

my @results = $user_rs->search(
	{
		'course_users.course_id' => $precalc->{course_id}
	},
	{
		join => ["course_users"]
	}
);
my @users = map {
	removeLoginParams({
		$_->get_columns,
		$_->course_users->first->get_columns,
		course_user_params => $_->course_users->first->get_inflated_column("course_user_params")
	});
} @results;

my @precalc_students_from_db = sort { $a->{username} cmp $b->{username} } @users;
for my $u (@precalc_students_from_db) {
	removeIDs($u);
}

is_deeply(\@precalc_students, \@precalc_students_from_db, "getUsers: get users from a course");

## getUsers: test that an unknown course results in an error

throws_ok {
	$user_rs->getCourseUsers(info => { course_name => "unknown_course" });
}
'DB::Exception::CourseNotFound', "getUsers: undefined course_name";

throws_ok {
	$user_rs->getCourseUsers(info => { course_id => -3 });
}
'DB::Exception::CourseNotFound', "getUsers: undefined course_id";

## test getCourseUser: merged user

my $user = $user_rs->getCourseUser(info => {
	course_name => "Precalculus",
	username => $precalc_students[0]->{username}
}, merged => 1);
removeIDs($user);

is_deeply($precalc_students[0], $user, "getCourseUser: get one merged user");

## getUser: test that an unknown course results in an error

throws_ok {
	$user_rs->getCourseUser(info => { course_name => "unknown_course", username => "barney" });
}
'DB::Exception::CourseNotFound', "getCourseUser: undefined course";

## getUser: test that an unknown user results in an error

throws_ok {
	$user_rs->getCourseUser(info => { course_name => "Precalculus", username => "unknown_user" });
}
'DB::Exception::UserNotFound', "getCourseUser: undefined user";

## getUser: test that an existing user who is not in the course returns an error.

throws_ok {
	$user_rs->getCourseUser(info => { course_name => "Arithmetic", username => "marge" });
}
'DB::Exception::UserNotInCourse', "getCourseUser: get a user that is not in the course";

## addUser:  add a user to a course

# remove the following user if already defined
my $quimby = $user_rs->find({
		'username' => 'quimby',
	});
$quimby->delete if defined($quimby);

my $user_params = {
	username   => "quimby",
	first_name => "Joe",
	last_name  => "Quimby",
	email      => 'mayor_joe@springfield.gov',
	student_id => "12345",
	is_admin   => 0
};
my $course_user_params = {
	username    => "quimby",
	role        => "student",
	course_user_params      => {},
	recitation  => undef,
	section     => undef
};
$user_rs->addGlobalUser(params => $user_params);
$user = $user_rs->addCourseUser(
	info => { course_name => "Arithmetic", username => "quimby"},
	params => $course_user_params
);
for my $key (qw/username course_name/) {
	delete $course_user_params->{$key};
}

removeIDs($user);
delete $user_params->{course_name};

is_deeply($course_user_params, $user, "addCourseUser: add a user to a course");

# add a user and check the return is a merged user

my $quimby_db  = $user_rs->addCourseUser(
	info => { course_name => 'Precalculus', username => 'quimby'},
	params => $course_user_params,
	merged => 1
);
removeIDs($quimby_db);

my $quimby_params = clone($course_user_params);
for my $key (keys %$user_params) {
	$quimby_params->{$key} = $user_params->{$key};
}

is_deeply($quimby_params,$quimby_db, "addCourseUser: check that an added user is returned merged");

## addCourseUser: check that if the course doesn't exist, an error is thrown:

throws_ok {
	$user_rs->addCourseUser(info => { course_name => "unknown_course", username => "barney" }, params => {});
}
"DB::Exception::CourseNotFound", "addCourseUser: the course doesn't exist";

## addCourseUser: the course exists, but the user is already a member.

throws_ok {
	$user_rs->addCourseUser(info => { course_name => "Arithmetic", username => "moe" });
}
"DB::Exception::UserAlreadyInCourse", "addCourseUser: the user is already a member";

# try to add a non-existent user from a course:

throws_ok {
	$user_rs->addCourseUser(info => { course_name => "Arithmetic", username => "non_existent_user" })
}
"DB::Exception::UserNotFound", "addCourseUser: try to add a non-existent user to a course";

## addCourseUser: add a user with undefined parameters

throws_ok {
	$user_rs->addCourseUser(
		info => { course_name => "Topology", username => "quimby" },
		params => {
			undefined_field => 1
		 }
	);
}
"DBIx::Class::Exception", "addCourseUser: an undefined field is passed in";


## addCourseUser: add a user with undefined parameters

throws_ok {
	$user_rs->addCourseUser(
		info => { course_name => "Topology", username => "quimby" },
		params => {
			course_user_params => {
				this_is_not_valid => 1
			}
		 }
	);
}
"DB::Exception::UndefinedParameter", "addCourseUser: an undefined parameter is set";

## addCourseUser: update a user with nonvalid fields

throws_ok {
	$user_rs->addCourseUser(
		info => { course_name => "Topology", username => "quimby" },
		params => {
			course_user_params => {
				useMathQuill => "yes"
			}
		 }
	);
}
"DB::Exception::InvalidParameter", "addCourseUser: an parameter with invalid value";


## updateCourseUser: check that the user updates.

my $updated_user = {
	course_user_params => {
		comment => 'Mayor Joe is the best!!'
	},
	recitation => "2"
};

for my $key (keys %$updated_user) {
	$course_user_params->{$key} = $updated_user->{$key};
}

my $user_from_db = $user_rs->updateCourseUser(
	info => { course_name => 'Arithmetic', username => 'quimby' },
	params => $updated_user
);

removeIDs($user_from_db);
is_deeply($course_user_params, $user_from_db, "updateCourseUser: update a single user in an existing course.");

## updateCourseUser: check that if the course doesn't exist, an error is thrown:
throws_ok {
	$user_rs->updateCourseUser(
		info => { course_name => "unknown_course", username => "barney" },
		params => $updated_user
	);
}
"DB::Exception::CourseNotFound", "updateCourseUser: the course doesn't exist";

## updateCourseUser: check that if the course exists, but the user not a member.
throws_ok {
	$user_rs->updateCourseUser(
		info => { course_name => "Arithmetic", username => "marge" },
		params => $updated_user
	);
}
"DB::Exception::UserNotInCourse", "updateCourseUser: the user is not a member of the course";

## updateCourseUser: send in wrong information

throws_ok {
	$user_rs->updateCourseUser(
		info => { course_name => "Arithmetic", user_name => "bart" },
		params => $updated_user
	);
}
"DB::Exception::ParametersNeeded", "updateCourseUser: the incorrect information is passed in.";

## updateCourseUser: update a user with nonvalid fields

throws_ok {
	$user_rs->updateCourseUser(
		info => { course_name => "Arithmetic", username => "quimby" },
		params => { sleeps_in_class => 1 }
	);
}
"DBIx::Class::Exception", "updateCourseUser: an invalid field is set";


## updateCourseUser: update a user with undefined parameters

throws_ok {
	$user_rs->updateCourseUser(
		info => { course_name => "Arithmetic", username => "quimby" },
		params => {
			course_user_params => {
				this_is_not_valid => 1
			}
		 }
	);
}
"DB::Exception::UndefinedParameter", "updateCourseUser: an undefined parameter is set";

## updateCourseUser: update a user with nonvalid fields

throws_ok {
	$user_rs->updateCourseUser(
		info => { course_name => "Arithmetic", username => "quimby" },
		params => {
			course_user_params => {
				useMathQuill => "yes"
			}
		 }
	);
}
"DB::Exception::InvalidParameter", "updateCourseUser: an parameter with invalid value";

## deleteUser: delete a single user from a course

my $deleted_user;

my $dont_delete_users;    # switch to not delete added users.

SKIP: {

	skip "delete added users", 5 if $dont_delete_users;

	my $deleted_course_user = $user_rs->deleteCourseUser(info => { course_name => "Arithmetic", username => "quimby" });
	removeIDs($deleted_course_user);

	is_deeply($course_user_params, $deleted_course_user, 'deleteCourseUser: delete a user from a course');

	$deleted_user = $user_rs->deleteGlobalUser(info => { username => "quimby" });
	removeIDs($deleted_user);

	is_deeply($user_params, $deleted_user, "deleteGlobalUser: delete a user");

## deleteUser: check that if the course doesn't exist, an error is thrown:

	throws_ok {
		$user_rs->deleteCourseUser(info => { course_name => "unknown_course", username => "barney" });
	}
	"DB::Exception::CourseNotFound", "deleteUser: the course doesn't exist";

## deleteUser: check that if the course exists, but the user not a member.

	throws_ok {
		$user_rs->deleteCourseUser(info => { course_name => "Arithmetic", username => "marge" });
	}
	"DB::Exception::UserNotInCourse", "deleteUser: the user is not a member of the course";

## deleteUser: send in username_name instead of username

	throws_ok {
		$user_rs->deleteCourseUser(info => { course_name => "Arithmetic", username_name => "bart" });
	}
	"DB::Exception::ParametersNeeded", "deleteUser: the incorrect information is passed in.";

}

done_testing;
