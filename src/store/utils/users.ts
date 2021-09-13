// This is utility functions for users

import { User, CourseUser, Dictionary } from '../models';
import { mailRE, usernameRE, user_roles } from './common';

export function newUser(): User {
	return {
		email: '',
		first_name: '',
		is_admin: false,
		last_name: '',
		username: '',
		student_id: '',
		user_id: 0
	};
}

export function newCourseUser(): CourseUser {
	return {
		course_user_id: 0,
		user_id: 0,
		course_id: 0,
		role: 'student',
		section: '',
		recitation: '',
		params: {}
	};
}

export function parseUser(params: Dictionary<string|number>): User {
	const user = newUser();
	const user_fields = Object.keys(user);
	Object.keys(params).forEach((key) => {
		if (user_fields.indexOf(key)<0) {
			throw {
				field: key,
				message: `The field '${key}' is not valid for a user`,
				params: params
			};
		}
	});
	validateUser(params);

	user.username = `${params.username}` || '';
	user.email = `${params.email}` || '';
	user.first_name = `${params.first_name}` || '';
	user.last_name = `${params.last_name}` || '';
	user.student_id = `${params.student_id}` || '';

	return user;
}

export function validateUser(params: Dictionary<string|number>): boolean {
	if (!mailRE.test(`${params.email}`)) {
		throw {
			field: 'email',
			message: `The field '${params.email}' is not an email address`
		};
	}

	if (!(mailRE.test(`${params.username}`) || usernameRE.test(`${params.username}`))) {
		throw {
			field: 'username',
			message: `The field '${params.username}' is not a valid username`
		};
	}
	return true;
}

export function parseCourseUser(params: Dictionary<string|number>): CourseUser {
	const course_user = newCourseUser();
	const user_fields = Object.keys(course_user);
	Object.keys(params).forEach((key) => {
		if (user_fields.indexOf(key)<0) {
			throw {
				field: key,
				message: `The field '${key}' is not valid for a course user`,
				params: params
			};
		}
	});
	validateCourseUser(params);

	course_user.user_id = parseInt(`${params.user_id}`) || 0;
	course_user.role = `${params.role}` || '';
	course_user.section = `${params.section}` || '';
	course_user.recitation = `${params.recitation}` || '';

	return course_user;
}

export function validateCourseUser(params: Dictionary<string|number>): boolean {

	if (user_roles.findIndex((v) => v === params.role) < 0) {
		throw { message: `The field '${params.role}' is not a valid role` };
	}
	return true;
}