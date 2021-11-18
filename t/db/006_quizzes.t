#!/usr/bin/env perl
#
# This tests the basic database CRUD functions of problem sets of type quiz.
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
use Test::More;
use Test::Exception;
use YAML::XS qw/LoadFile/;
use Clone qw/clone/;

use Array::Utils qw/array_minus intersect/;
use DateTime::Format::Strptime;

use DB::WithParams;
use DB::WithDates;
use DB::Schema;
use DB::TestUtils qw/loadCSV removeIDs filterBySetType loadSchema/;

# load the database
my $config_file = "$main::ww3_dir/conf/ww3-dev.yml";
die "The file $config_file does not exist.  Did you make a copy of it from ww3-dev.dist.yml ?"
	unless (-e $config_file);

my $config = LoadFile($config_file);

my $schema =
	DB::Schema->connect($config->{database_dsn}, $config->{database_user}, $config->{database_password});

my $strp = DateTime::Format::Strptime->new(pattern => '%FT%T', on_error => 'croak');

# $schema->storage->debug(1);  # print out the SQL commands.

my @hw_dates  = @DB::Schema::Result::ProblemSet::HWSet::VALID_DATES;
my @hw_params = @DB::Schema::Result::ProblemSet::HWSet::VALID_PARAMS;

my $problem_set_rs = $schema->resultset("ProblemSet");
my $course_rs      = $schema->resultset("Course");
my $user_rs        = $schema->resultset("User");

my @all_problem_sets;    # stores all problem_sets

my @quizzes = loadCSV("$main::ww3_dir/t/db/sample_data/quizzes.csv");
for my $quiz (@quizzes) {
	$quiz->{type}     = 2;
	$quiz->{set_type} = "QUIZ";
	for my $date (keys %{ $quiz->{set_dates} }) {
		my $dt = $strp->parse_datetime($quiz->{set_dates}->{$date});
		$quiz->{set_dates}->{$date} = $dt->epoch;
	}
}

## remove the quiz: Quiz #9 if it exists:

my $quiz_to_delete = $problem_set_rs->find({ set_name => "Quiz #9" });
$quiz_to_delete->delete if defined($quiz_to_delete);

## test: get all quizzes from one course
my @precalc_quizzes = filterBySetType(\@quizzes, "QUIZ", "Precalculus");
@precalc_quizzes = map {
	{%$_};
} @precalc_quizzes;    # clone all quizzes

for my $quiz (@precalc_quizzes) {
	delete $quiz->{course_name};
	# delete $quiz->{type};
}
@precalc_quizzes = sort { $a->{set_name} cmp $b->{set_name} } @precalc_quizzes;
my @precalc_quizzes_from_db = $problem_set_rs->getQuizzes({ course_name => "Precalculus" });

# remove id tags:
for my $quiz (@precalc_quizzes_from_db) {
	removeIDs($quiz);
}

is_deeply(\@precalc_quizzes, \@precalc_quizzes_from_db, "getQuizzes: get all quizzes for one course");

# get a single quiz

my $quiz_from_db = $problem_set_rs->getProblemSet({ course_name => "Precalculus", set_name => "Quiz #1" });
removeIDs($quiz_from_db);

my @quiz_from_csv = grep { $_->{set_name} eq "Quiz #1" } @precalc_quizzes;

delete $quiz_from_csv[0]->{type};

is_deeply($quiz_from_csv[0], $quiz_from_db, "getQuiz: get one quiz from a single course");

# try to get a quiz that doesn't exist in a course that does:

throws_ok {
	$problem_set_rs->getProblemSet({ course_name => "Precalculus", set_name => "nonexisent quiz" });
}
"DB::Exception::SetNotInCourse", "getQuiz: non-existent set name";

# try to get a quiz from a course that doesn't exist

throws_ok {
	$problem_set_rs->getProblemSet({ course_name => "nonexistent course", set_name => "Quiz #1" });
}
"DB::Exception::CourseNotFound", "getQuiz: try to get a quiz from a non-existent course";

## add a new quiz

my $new_quiz_params = {
	set_name  => "Quiz #9",
	set_dates => { open => 100, due => 140, answer => 200 },
	set_type  => "QUIZ"
};

my $new_quiz = $problem_set_rs->addProblemSet({ course_name => "Precalculus" }, $new_quiz_params);

removeIDs($new_quiz);

is_deeply($new_quiz, $new_quiz_params, "addQuiz: add a new quiz");

## try to add a quiz to a non existent course

throws_ok {
	$problem_set_rs->addProblemSet({ course_name => "nonexistent course", set_name => "Quiz #1" });
}
"DB::Exception::CourseNotFound", "addQuiz: try to add a quiz from a non-existent course";

## try to add a quiz with non-valid parameters:

throws_ok {
	$problem_set_rs->addProblemSet(
		{
			course_name => "Precalculus"
		},
		{
			set_type          => 'QUIZ',
			set_name          => "Quiz #99",
			nonexistent_field => 1,
		}
	)
}
"DBIx::Class::Exception", "addQuiz: try to add a quiz with a bad parameter";

## try to add a quiz without specifying the name:

throws_ok {
	$problem_set_rs->addProblemSet(
		{
			course_name => "Precalculus"
		},
		{
			set_type    => 'QUIZ',
			set_visible => 1,
		}
	);
}
"DB::Exception::ParametersNeeded", "addQuiz: try to add a quiz with a bad field";

## try to add a quiz with an undefined parameter:

throws_ok {
	$problem_set_rs->addProblemSet(
		{
			course_name => "Precalculus"
		},
		{
			set_type    => 'QUIZ',
			set_name    => "Quiz #99",
			set_visible => 1,
			set_params  => {
				param1 => 0
			},
			set_dates => {
				open   => 10,
				due    => 100,
				answer => 200,
			}
		}
	);
}
"DB::Exception::UndefinedParameter", "addQuiz: try to add a quiz with a undefined parameter";

## try to add a quiz with a non-valid parameter:

throws_ok {
	$problem_set_rs->addProblemSet(
		{
			course_name => "Precalculus"
		},
		{
			set_type    => 'QUIZ',
			set_name    => "Quiz #99",
			set_visible => 1,
			set_params  => {
				timed => 'yes'
			},
			set_dates => {
				open   => 10,
				due    => 100,
				answer => 200,
			}
		}
	);
}
"DB::Exception::InvalidParameter", "addQuiz: try to add a quiz with a non-valid parameter";

## try to add a quiz with a missing required date fields

throws_ok {
	$problem_set_rs->addProblemSet(
		{
			course_name => "Precalculus"
		},
		{
			set_type  => 'QUIZ',
			set_name  => "Quiz #99",
			set_dates => {
				open => 10,
				due  => 100
			}
		}
	);
}
"DB::Exception::RequiredDateFields", "addQuiz: try to add a quiz with a missing required date fields";

## try to add a quiz with an undefined date field

throws_ok {
	$problem_set_rs->addProblemSet(
		{
			course_name => "Precalculus"
		},
		{
			set_type    => 'QUIZ',
			set_name    => "Quiz #99",
			set_visible => 1,
			set_dates   => {
				open            => 10,
				due             => 100,
				answer          => 200,
				reduced_scoring => 300
			}
		}
	);
}
"DB::Exception::InvalidDateField", "addQuiz: try to add a quiz with an undefined date field";

## try to add a quiz with dates that are out of order

throws_ok {
	$problem_set_rs->addProblemSet(
		{
			course_name => "Precalculus"
		},
		{
			set_type    => 'QUIZ',
			set_name    => "Quiz #99",
			set_visible => 1,
			set_dates   => {
				open   => 10,
				due    => 300,
				answer => 200,
			}
		}
	);
}
"DB::Exception::ImproperDateOrder", "addQuiz: try to add a quiz with dates that are out of order";

# update the visibility of the quiz

my $updated_params = { set_visible => 0 };

my $updated_quiz = $problem_set_rs->updateProblemSet(
	{
		course_name => "Precalculus",
		set_name    => "Quiz #9"
	},
	$updated_params
);

$new_quiz->{set_visible} = 0;
$new_quiz->{set_params}  = {};

removeIDs($updated_quiz);

is_deeply($new_quiz, $updated_quiz, "updateQuiz: successfully update the quiz");

# update the params of the quiz

$updated_params = {
	set_params => {
		timed => 1
	}
};

$updated_quiz = $problem_set_rs->updateProblemSet(
	{
		course_name => "Precalculus",
		set_name    => "Quiz #9"
	},
	$updated_params
);
removeIDs($updated_quiz);

$new_quiz->{set_params} = { timed => 1 };

is_deeply($new_quiz, $updated_quiz, "updateQuiz: successfully update the params of the quiz");

# update the dates of the quiz

$updated_params = {
	set_dates => {
		open   => 400,
		due    => 500,
		answer => 600
	}
};

$updated_quiz = $problem_set_rs->updateProblemSet(
	{
		course_name => "Precalculus",
		set_name    => "Quiz #9"
	},
	$updated_params
);
removeIDs($updated_quiz);

$new_quiz->{set_dates} = clone($updated_params->{set_dates});

is_deeply($new_quiz, $updated_quiz, "updateQuiz: successfully update the dates of the quiz");

# try to update a non-existent field of the quiz

throws_ok {
	$problem_set_rs->updateProblemSet(
		{
			course_name => "Precalculus",
			set_name    => "Quiz #9"
		},
		{
			nonexistent_field => 1
		}
	);
}
"DBIx::Class::Exception", "updateQuiz: try to update a quiz with a non-valid field";

# try to update a non-existent param of the quiz

throws_ok {
	$problem_set_rs->updateProblemSet(
		{
			course_name => "Precalculus",
			set_name    => "Quiz #9"
		},
		{
			set_params => {
				show_hint => 1
			}
		}
	);
}
"DB::Exception::UndefinedParameter", "updateQuiz: try to update a quiz with an undefined parameter";

# try to update a parameter with a bad value

throws_ok {
	$problem_set_rs->updateProblemSet(
		{
			course_name => "Precalculus",
			set_name    => "Quiz #9"
		},
		{
			set_params => {
				timed => 'yes'
			}
		}
	);
}
"DB::Exception::InvalidParameter", "updateQuiz: try to update a quiz with a non-valid field";

# try to update a quiz with an invalid  date

throws_ok {
	$problem_set_rs->updateProblemSet(
		{
			course_name => "Precalculus",
			set_name    => "Quiz #9"
		},
		{
			set_dates => {
				reduced_scoring => 1000
			}
		}
	);
}
"DB::Exception::InvalidDateField", "updateQuiz: try to update a quiz with a non-valid date";

# try to update a quiz with a date out of order

throws_ok {
	$problem_set_rs->updateProblemSet(
		{
			course_name => "Precalculus",
			set_name    => "Quiz #9"
		},
		{
			set_dates => {
				open => 50,
				due  => 40
			}
		}
	);
}
"DB::Exception::ImproperDateOrder", "updateQuiz: try to update a quiz with out of order dates";

# try to delete from a non-existent course:

throws_ok {
	$problem_set_rs->deleteProblemSet({
		course_name => "Course does not exist",
		set_name    => "Quiz #9"
	});
}
"DB::Exception::CourseNotFound", 'deleteQuiz: try to delete a quiz from a non-existent course';

# try to delete from a non-existent course:

throws_ok {
	$problem_set_rs->deleteProblemSet({
		course_id => 9999,
		set_name  => "Quiz #9"
	});
}
"DB::Exception::CourseNotFound", 'deleteQuiz: try to delete a quiz from a non-existent course_id';

# try to delete from a non-existent set in a  course:

throws_ok {
	$problem_set_rs->deleteProblemSet({
		course_name => "Precalculus",
		set_name    => "Quiz #999"
	});
}
"DB::Exception::SetNotInCourse", 'deleteQuiz: try to delete a non-existent quiz';

# try to delete from a non-existent set in a  course:

throws_ok {
	$problem_set_rs->deleteProblemSet({
		course_name => "Precalculus",
		set_id      => 99999
	});
}
"DB::Exception::SetNotInCourse", 'deleteQuiz: try to delete a non-existent quiz as set_id';

# try to delete from a non-existent set in a  course:

my $deleted_quiz = $problem_set_rs->deleteProblemSet({
	course_name => "Precalculus",
	set_name    => "Quiz #9"
});

removeIDs($deleted_quiz);
is_deeply($deleted_quiz, $new_quiz, "delete Quiz: successfully delete a quiz");

done_testing;

## helpful subroutines

1;
