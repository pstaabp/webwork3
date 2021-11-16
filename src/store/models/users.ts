// This is utility functions for users

import { Model, ParseableModel } from 'src/store/models/index';

export interface ParseableUser {
	user_id?: number | string;
	username?: string;
	email?: string;
	first_name?: string;
	last_name?: string;
	is_admin?: string | number | boolean;
	student_id?: string | number;
}

export class User extends Model(
	['is_admin'], ['user_id'], ['username', 'email', 'first_name', 'last_name', 'student_id'], [],
	{
		username: { field_type: 'username', required: true },
		email: { field_type: 'email' },
		user_id: { field_type: 'non_neg_int', default_value: 0 },
		first_name: { field_type: 'string' },
		last_name: { field_type: 'string' },
		is_admin: { field_type: 'boolean', default_value: false },
		student_id: { field_type: 'string' }
	}) {
	static REQUIRED_FIELDS = ['username'];
	static OPTIONAL_FIELDS = ['email', 'user_id', 'first_name', 'last_name', 'is_admin', 'student_id'];
	static ALL_FIELDS = [...User.REQUIRED_FIELDS, ...User.OPTIONAL_FIELDS];

	constructor(params: ParseableUser = {}) {
		super(params as ParseableModel);
	}

}

export interface ParseableCourseUser {
	course_user_id?: number | string;
	user_id?: number | string;
	course_id?: number | string;
	role?: string;
	section?: string | number;
	recitation?: string | number;
}

export class CourseUser extends Model(
	[], ['course_user_id', 'user_id', 'course_id'], ['role', 'section', 'recitation'], ['params'],
	{
		course_user_id: { field_type: 'non_neg_int', default_value: 0 },
		course_id: { field_type: 'non_neg_int', default_value: 0 },
		user_id: { field_type: 'non_neg_int', default_value: 0 },
		role: { field_type: 'role' },
		section: { field_type: 'string' },
		recitation: { field_type: 'string' }
	}) {
	static REQUIRED_FIELDS = [];
	static OPTIONAL_FIELDS = ['course_user_id', 'user_id', 'course_id', 'role', 'section', 'recitation', 'params'];
	static ALL_FIELDS = [...CourseUser.REQUIRED_FIELDS, ...CourseUser.OPTIONAL_FIELDS];

	constructor(params: ParseableCourseUser = {}) {
		super(params as ParseableModel);
	}
}

/* This is a join between a User and a CourseUser, which
is much more appropriate for the client side in the instructor */

export interface ParseableMergedUser {
	course_user_id?: number | string;
	user_id?: number | string;
	course_id?: number | string;
	username?: string;
	email?: string;
	first_name?: string;
	last_name?: string;
	is_admin?: boolean | number | string;
	student_id?: string;
	role?: string;
	section?: string | number;
	recitation?: string | number;
}

export class MergedUser extends Model(
	['is_admin'], ['user_id', 'course_id', 'course_user_id'],
	['username', 'email', 'first_name', 'last_name', 'student_id', 'course_user_id', 'role', 'section', 'recitation'],
	['params'],
	{
		username: { field_type: 'username', required: true },
		email: { field_type: 'email' },
		user_id: { field_type: 'non_neg_int', default_value: 0 },
		first_name: { field_type: 'string' },
		last_name: { field_type: 'string' },
		is_admin: { field_type: 'boolean', default_value: false },
		student_id: { field_type: 'string' },
		course_user_id: { field_type: 'non_neg_int', default_value: 0 },
		course_id: { field_type: 'non_neg_int', default_value: 0 },
		role: { field_type: 'role' },
		section: { field_type: 'string' },
		recitation: { field_type: 'string' }
	}) {
	static REQUIRED_FIELDS = ['username'];
	static OPTIONAL_FIELDS = [...User.OPTIONAL_FIELDS, ...CourseUser.OPTIONAL_FIELDS];
	static ALL_FIELDS = [...MergedUser.REQUIRED_FIELDS, ...MergedUser.OPTIONAL_FIELDS];

	constructor(params: ParseableMergedUser = {}) {
		super(params as ParseableModel);
	}

}
