import { RequiredFieldsException, ModelParams, Model, Dictionary, generic  } from 'src/common/models';
import { parseNonNegInt, parseBoolean } from './parsers';

export interface ParseableCourse {
	course_id?: number | string;
	course_name?: string;
	visible?: string | number | boolean;
	course_dates? : ParseableCourseDates;
}

export interface ParseableCourseDates {
	start?: string;
	end?: string;
}

class CourseDates extends ModelParams([], [], ['start', 'end'], {
	start: { field_type: 'string' },
	end: { field_type: 'string' }
}) {
	constructor() {
		super();
		// set default values
		this.start = '';
		this.end = '';
	}
}

export class Course extends Model {
	private _course_id = 0;
	private _course_name = '';
	private _visible = true;
	private course_dates = new CourseDates();

	get all_field_names(): string[] {
		return ['course_id', 'course_name', 'visible', 'course_dates'];
	}

	get param_fields(): string[] {
		return ['course_dates'];
	}

	constructor(params: ParseableCourse = {}) {
		super();
		if (params.course_name == undefined) {
			throw new RequiredFieldsException('course_name');
		}
		this.set(params);
	}

	set(params: ParseableCourse) {
		if (params.course_id != undefined) this.course_id = params.course_id;
		if (params.course_name != undefined) this.course_name = params.course_name;
		if (params.visible != undefined) this.visible = params.visible;
		super.checkParams(params as Dictionary<generic>);
	}

	setDates(date_params: ParseableCourseDates = {}) {
		this.course_dates.set(date_params as Dictionary<generic>);
	}

	get course_id() { return this._course_id; }
	set course_id(value: string | number) {
		this._course_id = parseNonNegInt(value);
	}

	get course_name() { return this._course_name; }
	set course_name(value: string) {
		this._course_name = value;
	}

	get visible() { return this._visible; }
	set visible(value: string | number | boolean) {
		this._visible = parseBoolean(value);
	}

}
