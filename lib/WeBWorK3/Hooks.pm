package WeBWorK3::Hooks;

use warnings;
use strict;
use feature 'signatures';
no warnings qw(experimental::signatures);

use Try::Tiny;

our $VERSION = '2.99';

our $exception_handler = sub ($next, $c) {
	# Only test requests that start with "/api".
	if ($c->req->url->to_string =~ /\/api/x) {
		try {
			$next->();
		} catch {
			my $output = { exception => ref($_) };
			$output->{message} = $_->message
				if (ref($_) && (ref($_) eq 'Mojo::Exception' || ref($_) =~ /^DB::Exception/x));
			$output->{message} = $_ if ($_ && ref($_) eq 'DBIx::Class::Exception');
			$c->log->error($output->{message});
			$c->render(json => $output, status => 250);
		};
	} else {
		$next->();
	}
};

sub has_permission ($user, $perm) {
	if ($perm->{allowed_users}) {
		return "" unless $user->{role};
		return grep { $_ eq $user->{role} } @{ $perm->{allowed_users} };
	}
	return 1 unless ($perm->{check_permission} || $perm->{admin_required});
	return ($user && $user->{is_admin}) if $perm->{admin_required};

	return 1;
}

# Check permission for /api routes
our $check_permission = sub ($next, $c, $action, $) {
	return $next->() if ($c->ignore_permissions || $c->req->url->to_string =~ /\/api\/login/x);
	my $user = $c->current_user;
	if ($c->stash('course_id')) {
		my $user_obj = $c->schema->resultset('User')
			->getGlobalUser(info => { user_id => $c->current_user->{user_id} }, as_result_set => 1);
		my $course_user = $user_obj->course_users->find({ course_id => $c->param('course_id') });
		$user = { %{$user}, $course_user->get_inflated_columns };
	}

	my $controller_name = $c->{stash}->{controller};
	my $action_name     = $c->{stash}->{action};
	if ($c->req->url->to_string =~ /\/api/x) {
		if (has_permission($user, $c->perm_table->{$controller_name}->{$action_name})) {
			return $next->();
		} else {
			$c->render(json => { has_permission => 0, msg => "permission error" });
		}
	} else {
		$next->();
	}
};

1;
