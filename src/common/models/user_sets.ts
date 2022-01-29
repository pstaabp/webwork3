/**
 * This defines UserSets and MergedUserSets
 */

import { Model } from '.';
import { parseBoolean, parseNonNegInt, parseUsername } from './parsers';
import { ProblemSetDates, ProblemSetParams, HomeworkSetParams, HomeworkSetDates,
	ParseableHomeworkSetParams, ParseableHomeworkSetDates, QuizParams, QuizDates,
	ParseableQuiz, ParseableQuizDates, ParseableQuizParams, ParseableReviewSetDates,
	ParseableReviewSetParams, ParseableReviewSet, ReviewSetDates, ReviewSetParams } from './problem_sets';

export interface ParseableUserSet {
	user_set_id?: number | string;
	set_id?: number | string;
	course_user_id?: number | string;
	set_version?: number | string;
	set_params?: ProblemSetParams;
	set_dates?: ProblemSetDates;
}

export class UserSet extends Model {
	private _user_set_id = 0;
	private _set_id = 0;
	private _course_user_id = 0;
	private _set_version = 1;

	get all_field_names(): string[] {
		return ['user_set_id', 'set_id', 'course_user_id', 'set_version', 'set_params', 'set_dates'];
	}

	get param_fields(): string[] {
		return ['set_params', 'set_dates'];
	}

	constructor(params: ParseableUserSet = {}) {
		super();
		this.set(params);
	}

	set(params: ParseableUserSet) {
		if (params.user_set_id != undefined) this.user_set_id = params.user_set_id;
		if (params.set_id != undefined) this.set_id = params.set_id;
		if (params.course_user_id != undefined) this.course_user_id = params.course_user_id;
		if (params.set_version != undefined) this.set_version = params.set_version;
	}

	public get user_set_id(): number { return this._user_set_id;}
	public set user_set_id(value: number | string) { this._user_set_id = parseNonNegInt(value);}

	public get set_id(): number { return this._set_id;}
	public set set_id(value: number | string) { this._set_id = parseNonNegInt(value);}

	public get course_user_id(): number { return this._course_user_id;}
	public set course_user_id(value: number | string) { this._course_user_id = parseNonNegInt(value);}

	public get set_version(): number { return this._set_version;}
	public set set_version(value: number | string) { this._set_version = parseNonNegInt(value);}

}

/**
 * UserHomeworkSet is a HomeworkSet for a User
 */

export interface ParseableUserHomeworkSet {
	user_set_id?: number | string;
	set_id?: number | string;
	course_user_id?: number | string;
	set_version?: number | string;
	set_params?: ParseableHomeworkSetParams;
	set_dates?: ParseableHomeworkSetDates;
}

export class UserHomeworkSet extends UserSet {
	private _set_params = new HomeworkSetParams();
	private _set_dates = new HomeworkSetDates();

	get set_params() { return this._set_params;}
	get set_dates() { return this._set_dates;}

	constructor(params: ParseableUserHomeworkSet = {}) {
		super(params as ParseableUserSet);
		if (params.set_params) this._set_params.set(params.set_params);
		if (params.set_dates) this._set_dates.set(params.set_dates);
	}

	public hasValidDates() {
		return this.set_dates.isValid({ enable_reduced_scoring: this.set_params.enable_reduced_scoring });
	}
}

/**
 * UserQuiz is a Quiz for a User
 */

export interface ParseableUserQuiz {
	user_set_id?: number | string;
	set_id?: number | string;
	course_user_id?: number | string;
	set_version?: number | string;
	set_params?: ParseableQuizParams;
	set_dates?: ParseableQuizDates;
}

export class UserQuiz extends UserSet {
	private _set_params = new QuizParams();
	private _set_dates = new QuizDates();

	get set_params() { return this._set_params;}
	get set_dates() { return this._set_dates;}

	constructor(params: ParseableQuiz = {}) {
		super(params as ParseableUserSet);
		if (params.set_params) this._set_params.set(params.set_params);
		if (params.set_dates) this._set_dates.set(params.set_dates);
	}

	public hasValidDates() {
		return this.set_dates.isValid();
	}
}

/**
 * UserReviewSet is a ReviewSet for a User
 */

export interface ParseableUserReviewSet {
	user_set_id?: number | string;
	set_id?: number | string;
	course_user_id?: number | string;
	set_version?: number | string;
	set_params?: ParseableReviewSetParams;
	set_dates?: ParseableReviewSetDates;
}

export class UserReviewSet extends UserSet {
	private _set_params = new ReviewSetParams();
	private _set_dates = new ReviewSetDates();

	get set_params() { return this._set_params;}
	get set_dates() { return this._set_dates;}

	constructor(params: ParseableReviewSet = {}) {
		super(params as ParseableUserSet);
		if (params.set_params) this._set_params.set(params.set_params);
		if (params.set_dates) this._set_dates.set(params.set_dates);
	}

	public hasValidDates() {
		return this.set_dates.isValid();
	}
}

/**
 * MergedUserSet is a structure that is a joined version of a UserSet and a ProblemSet
 */

export interface ParseableMergedUserSet {
	user_set_id?: number | string;
	set_id?: number | string;
	course_user_id?: number | string;
	set_version?: number | string;
	set_visible?: number | string | boolean;
	set_name?: string;
	username?: string;
	set_params?: ProblemSetParams;
	set_dates?: ProblemSetDates;
}

export class MergedUserSet extends Model {
	private _user_set_id = 0;
	private _set_id = 0;
	private _course_user_id = 0;
	private _set_version = 1;
	private _set_visible = false;
	private _set_name = '';
	private _username = '';

	get all_field_names(): string[] {
		return ['user_set_id', 'set_id', 'course_user_id', 'set_version',
			'set_visible', 'set_name', 'username',
			'set_params', 'set_dates'];
	}

	get param_fields(): string[] {
		return ['set_params', 'set_dates'];
	}

	constructor(params: ParseableMergedUserSet = {}) {
		super();
		this.set(params);
	}

	set(params: ParseableMergedUserSet) {
		if (params.user_set_id != undefined) this.user_set_id = params.user_set_id;
		if (params.set_id != undefined) this.set_id = params.set_id;
		if (params.course_user_id != undefined) this.course_user_id = params.course_user_id;
		if (params.set_version != undefined) this.set_version = params.set_version;
		if (params.set_visible != undefined) this.set_visible = params.set_visible;
		if (params.set_name != undefined) this.set_name = params.set_name;
		if (params.username != undefined) this.username = params.username;
	}

	public get user_set_id(): number { return this._user_set_id;}
	public set user_set_id(value: number | string) { this._user_set_id = parseNonNegInt(value);}

	public get set_id(): number { return this._set_id;}
	public set set_id(value: number | string) { this._set_id = parseNonNegInt(value);}

	public get course_user_id(): number { return this._course_user_id;}
	public set course_user_id(value: number | string) { this._course_user_id = parseNonNegInt(value);}

	public get set_version(): number { return this._set_version;}
	public set set_version(value: number | string) { this._set_version = parseNonNegInt(value);}

	public get set_visible(): boolean { return this._set_visible; }
	public set set_visible(value: number | string | boolean) { this._set_visible = parseBoolean(value);}

	public get set_name(): string { return this._set_name; }
	public set set_name(value: string) { this._set_name = value; }

	public get username(): string { return this._username; }
	public set username(value: string) { this._username = parseUsername(value);}
}

/**
 * MergedUserHomeworkSet is joined HomeworkSet and a UserSet
 */

export interface ParseableMergedUserHomeworkSet {
	user_set_id?: number | string;
	set_id?: number | string;
	course_user_id?: number | string;
	set_version?: number | string;
	set_visible?: number | string | boolean;
	set_name?: string;
	username?: string;
	set_params?: ParseableHomeworkSetParams;
	set_dates?: ParseableHomeworkSetDates;
}

export class MergedUserHomeworkSet extends MergedUserSet {
	private _set_params = new HomeworkSetParams();
	private _set_dates = new HomeworkSetDates();

	get set_params() { return this._set_params;}
	get set_dates() { return this._set_dates;}

	constructor(params: ParseableMergedUserHomeworkSet = {}) {
		super(params as ParseableMergedUserSet);
		if (params.set_params) this._set_params.set(params.set_params);
		if (params.set_dates) this._set_dates.set(params.set_dates);
	}

	public hasValidDates() {
		return this.set_dates.isValid({ enable_reduced_scoring: this.set_params.enable_reduced_scoring });
	}
}

/**
 * MergedUserQuiz is a Quiz merged with a UserSet
 */

export interface ParseableMergedUserQuiz {
	user_set_id?: number | string;
	set_id?: number | string;
	course_user_id?: number | string;
	set_version?: number | string;
	set_visible?: number | string | boolean;
	set_name?: string;
	username?: string;
	set_params?: ParseableQuizParams;
	set_dates?: ParseableQuizDates;
}

export class MergedUserQuiz extends MergedUserSet {
	private _set_params = new QuizParams();
	private _set_dates = new QuizDates();

	get set_params() { return this._set_params;}
	get set_dates() { return this._set_dates;}

	constructor(params: ParseableMergedUserQuiz = {}) {
		super(params as ParseableMergedUserSet);
		if (params.set_params) this._set_params.set(params.set_params);
		if (params.set_dates) this._set_dates.set(params.set_dates);
	}

	public hasValidDates() {
		return this.set_dates.isValid();
	}
}

/**
 * MergedUserReviewSet is ReviewSet for a User
 */

export interface ParseableMergedUserReviewSet {
	user_set_id?: number | string;
	set_id?: number | string;
	course_user_id?: number | string;
	set_version?: number | string;
	set_params?: ParseableReviewSetParams;
	set_dates?: ParseableReviewSetDates;
}

export class MergedUserReviewSet extends MergedUserSet {
	private _set_params = new ReviewSetParams();
	private _set_dates = new ReviewSetDates();

	get set_params() { return this._set_params;}
	get set_dates() { return this._set_dates;}

	constructor(params: ParseableMergedUserReviewSet = {}) {
		super(params as ParseableMergedUserSet);
		if (params.set_params) this._set_params.set(params.set_params);
		if (params.set_dates) this._set_dates.set(params.set_dates);
	}

	public hasValidDates() {
		return this.set_dates.isValid();
	}
}