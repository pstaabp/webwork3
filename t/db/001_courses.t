#!/usr/bin/env perl
#
# This tests the basic database CRUD functions with courses.
#
use warnings;
use strict;

BEGIN {
	use File::Basename qw/dirname/;
	use Cwd qw/abs_path/;
	$main::ww3_dir = abs_path(dirname(__FILE__)) . '/../..';
}

use lib "$main::ww3_dir/lib";

use List::MoreUtils qw(uniq);

use Test::More;
use Test::Exception;
use YAML::XS qw/LoadFile/;

use DB::WithParams;
use DB::WithDates;
use DB::Schema;

use DB::TestUtils qw/loadCSV removeIDs loadSchema/;

# load some configuration for the database:

my $config_file = "$main::ww3_dir/conf/ww3-dev.yml";
die "The file $config_file does not exist.  Did you make a copy of it from ww3-dev.dist.yml ?"
	unless (-e $config_file);

my $config = LoadFile($config_file);

my $schema =
	DB::Schema->connect($config->{database_dsn}, $config->{database_user}, $config->{database_password});

# $schema->storage->debug(1);  # print out the SQL commands.

my $course_rs = $schema->resultset("Course");

## get a list of courses from the CSV file

my @courses = loadCSV("$main::ww3_dir/t/db/sample_data/courses.csv");
for my $course (@courses) {
	delete $course->{course_params};
}
@courses = sortByCourseName(\@courses);

## check the list of all courses
my @courses_from_db = $course_rs->getCourses;
for my $course (@courses_from_db) { removeIDs($course); }
@courses_from_db = sortByCourseName(\@courses_from_db);

is_deeply(\@courses_from_db, \@courses, "getCourses: course names");

## get a single course by name

my $course  = $course_rs->getCourse({ course_name => "Calculus" });
my $calc_id = $course->{course_id};
delete $course->{course_id};
my @calc_courses = grep { $_->{course_name} eq "Calculus" } @courses;
is_deeply($course, $calc_courses[0], "getCourse: get a single course by name");

## get a single course by course_id

$course = $course_rs->getCourse({ course_id => $calc_id });
delete $course->{course_id};
is_deeply($course, $calc_courses[0], "getCourse: get a single course by id");

## try to get a single course with sending proper info:
throws_ok {
	$course_rs->getCourse({ course_id => $calc_id, course_name => "Calculus" });
}
"DB::Exception::ParametersNeeded", "getCourse: sends too much info";

throws_ok {
	$course_rs->getCourse({ name => "Calculus" });
}
"DB::Exception::ParametersNeeded", "getCourse: sends wrong info";

## try to get a single course that doesn't exist

throws_ok {
	$course_rs->getCourse({ course_name => "non_existent_course" });
}
"DB::Exception::CourseNotFound", "getCourse: get a non-existent course";

## add a course
my $new_course_params = {
	course_name  => "Geometry",
	visible      => 1,
	course_dates => {}
};

my $new_course      = $course_rs->addCourse($new_course_params);
my $added_course_id = $new_course->{course_id};
removeIDs($new_course);

is_deeply($new_course_params, $new_course, "addCourse: add a new course");

## add a course that already exists

throws_ok {
	$course_rs->addCourse({ course_name => "Geometry", visible => 1 });
}
"DB::Exception::CourseExists", "addCourse: course already exists";

## update the course name

my $updated_course = $course_rs->updateCourse({ course_id => $added_course_id }, { course_name => "Geometry II" });

$new_course_params->{course_name} = "Geometry II";
delete $updated_course->{course_id};

is_deeply($new_course_params, $updated_course, "updateCourse: update a course by name");

## Try to update an non-existent course

throws_ok {
	$course_rs->updateCourse({ course_name => "non_existent_course" });
}
"DB::Exception::CourseNotFound", "updateCourse: update a non-existent course_name";

throws_ok {
	$course_rs->updateCourse({ course_id => -9 }, $new_course_params);
}
"DB::Exception::CourseNotFound", "updateCourse: update a non-existent course_id";

## delete a course
my $deleted_course = $course_rs->deleteCourse({ course_name => "Geometry II" });
removeIDs($deleted_course);

is_deeply($new_course_params, $deleted_course, "deleteCourse: delete a course");

## try to delete a non-existent course by name
throws_ok {
	$course_rs->deleteCourse({ course_name => "undefined_name" })
}
"DB::Exception::CourseNotFound", "deleteCourse: delete a non-existent course_name";

## try to delete a non-existent course by id
throws_ok {
	$course_rs->deleteCourse({ course_id => -9 })
}
"DB::Exception::CourseNotFound", "deleteCourse: delete a non-existent course_id";

## get a list of courses for a user

my @user_courses = $course_rs->getUserCourses({ username => "lisa" });
for my $user_course (@user_courses) {
	removeIDs($user_course);
}

my @students = loadCSV("$main::ww3_dir/t/db/sample_data/students.csv");

my @user_courses_from_csv = grep { $_->{username} eq "lisa" } @students;

for my $user_course (@user_courses_from_csv) {
	for my $key (qw/email first_name last_name username student_id/) {
		delete $user_course->{$key};
	}
}

is_deeply(\@user_courses, \@user_courses_from_csv, "getUserCourses: get all courses for a given user");

## try to get a list of course from a non-existent user

throws_ok {
	$course_rs->getUserCourses({ username => "non_existent_user" });
}
"DB::Exception::UserNotFound", "getUserCourse: try to get a list of courses for a non-existent user";

sub sortByCourseName {
	my $course_rs = shift;
	my @new_array = sort { $a->{course_name} cmp $b->{course_name} } @$course_rs;
	return @new_array;
}

done_testing();

