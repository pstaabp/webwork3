#!/usr/bin/env perl

=head1 NAME

role_perm_to_db.pl - Load the roles and permissions in conf/role_perm.yml into the database

=head1 SYNOPSIS

role_perm_to_db.p [options]

 Options:
   -h|--help    Show full help

=head1 DESCRIPTION

All of the roles and permissions for webwork3 is defined in conf/role_perm.yml (or it's
default file role_perm.dist.yml).  This script checks for consistancy of that file and
then loads the roles and permissions into the database.

=cut

use warnings;
use strict;
use feature 'say';

BEGIN {
	use File::Basename qw/dirname/;
	use Cwd qw/abs_path/;
	$main::webwork3_dir = dirname(dirname(abs_path(__FILE__)));
}

use lib "$main::webwork3_dir/lib";

use Getopt::Long qw(:config bundling);
use Pod::Usage;
use YAML::XS qw/LoadFile/;
use DBI;
use DB::Schema;
use Try::Tiny;

my $showHelp;
GetOptions('h|help' => \$showHelp);
pod2usage({ -verbose => 2, -exitval => 0 }) if $showHelp;

# Load the configuration to obtain the database settings.
my $config = LoadFile("$main::webwork3_dir/conf/webwork3.yml");

# Connect to the database.
my $schema = DB::Schema->connect(
	$config->{database_dsn},
	$config->{database_user},
	$config->{database_password},
	{ quote_names => 1 }
);

my $role_perm_file = "$main::webwork3_dir/conf/role_perm.yml";
# if it doesn't exist, load the default one:
$role_perm_file = "$main::webwork3_dir/conf/role_perm.dist.yml" unless -r $role_perm_file;

# load any YAML true/false as booleans, not string true/false.
local $YAML::XS::Boolean = "JSON::PP";
my $role_perm = LoadFile($role_perm_file);

use Data::Dumper;

# clear out the tables role, db_perm, ui_perm
$schema->resultset('Role')->delete_all;
$schema->resultset('DBPermission')->delete_all;
$schema->resultset('UIPermission')->delete_all;

# add the roles to the database

my @roles = map { {role_name => $_}; } @{$role_perm->{roles}};
$schema->resultset('Role')->populate(\@roles);

# add the database permissions
for my $category (keys %{$role_perm->{db_permissions}}) {
	for my $task (keys %{$role_perm->{db_permissions}->{$category}}) {
		my $row = { category => $category, task => $task };
		$row->{admin_required} = $role_perm->{db_permissions}->{$category}->{$task}->{admin_required}
			if $role_perm->{db_permissions}->{$category}->{$task}->{admin_required};

		my $allowed_roles = $role_perm->{db_permissions}->{$category}->{$task}->{allowed_roles}
			if $role_perm->{db_permissions}->{$category}->{$task}->{allowed_roles};

		# check that the allowed roles exist.
		for my $role (@$allowed_roles) {
			my $role_in_db = $schema->resultset('Role')->find({ role_name => $role });
			die "The role '$role' does not exist." unless defined $role_in_db;
		}
		$row->{allowed_roles} = $allowed_roles;

		$schema->resultset('DBPermission')->create($row);
	}
}

# add the UI permissions

for my $route (keys %{$role_perm->{ui_permissions}}) {
	my $allowed_roles = $role_perm->{ui_permissions}->{$route};

	# check that the allowed roles exist.
	for my $role (@$allowed_roles) {
		next if $role eq '*';
		my $role_in_db = $schema->resultset('Role')->find({ role_name => $role });
		die "The role '$role' does not exist." unless defined $role_in_db;
	}

	$schema->resultset('UIPermission')->create({
		route => $route,
		allowed_roles => $allowed_roles
	});
}

1;