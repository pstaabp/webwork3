// tests parsing and handling of users

import { CourseSetting, DBCourseSetting, GlobalSetting, SettingType
} from 'src/common/models/settings';

describe('Testing Course Settings', () => {
	const global_setting = {
		setting_id: 0,
		setting_name: '',
		default_value: '',
		category: '',
		description: '',
		type: SettingType.unknown
	};

	describe('Create a new GlobalSetting', () => {
		test('Create a default GlobalSetting', () => {
			const setting = new GlobalSetting();

			expect(setting).toBeInstanceOf(GlobalSetting);
			expect(setting.toObject()).toStrictEqual(global_setting);
		});

		test('Create a new GlobalSetting', () => {
			const global_setting = new GlobalSetting({
				setting_id: 10,
				setting_name: 'description',
				default_value: 'This is the description',
				description: 'Describe this.',
				doc: 'Extended help',
				type: 'text',
				category: 'general'
			});

			expect(global_setting.setting_id).toBe(10);
			expect(global_setting.setting_name).toBe('description');
			expect(global_setting.default_value).toBe('This is the description');
			expect(global_setting.description).toBe('Describe this.');
			expect(global_setting.doc).toBe('Extended help');
			expect(global_setting.type).toBe(SettingType.text);
			expect(global_setting.category).toBe('general');
		});

		test('Check that calling all_fields() and params() is correct', () => {
			const settings_fields = ['setting_id', 'setting_name', 'default_value', 'category', 'subcategory',
				'description', 'doc', 'type', 'options'];
			const setting = new GlobalSetting();

			expect(setting.all_field_names.sort()).toStrictEqual(settings_fields.sort());
			expect(setting.param_fields.sort()).toStrictEqual([]);
			expect(GlobalSetting.ALL_FIELDS.sort()).toStrictEqual(settings_fields.sort());
		});

		test('Check that cloning works', () => {
			const setting = new GlobalSetting();
			expect(setting.clone().toObject()).toStrictEqual(global_setting);
			expect(setting.clone()).toBeInstanceOf(GlobalSetting);
		});

	});

	describe('Updating global settings', () => {
		test('set fields of a global setting directly', () => {
			const global_setting = new GlobalSetting();

			global_setting.setting_id = 10;
			expect(global_setting.setting_id).toBe(10);

			global_setting.setting_name = 'description';
			expect(global_setting.setting_name).toBe('description');

			global_setting.category = 'general';
			expect(global_setting.category).toBe('general');

			global_setting.subcategory = 'problems';
			expect(global_setting.subcategory).toBe('problems');

			global_setting.default_value = 6;
			expect(global_setting.default_value).toBe(6);

			global_setting.description = 'This is the help.';
			expect(global_setting.description).toBe('This is the help.');

			global_setting.description = 'This is the extended help.';
			expect(global_setting.description).toBe('This is the extended help.');

			global_setting.type = 'int';
			expect(global_setting.type).toBe(SettingType.int);

			global_setting.type = 'undefined type';
			expect(global_setting.type).toBe(SettingType.unknown);

		});

		test('set fields of a course setting using the set method', () => {
			const global_setting = new GlobalSetting();

			global_setting.set({ setting_id:  25 });
			expect(global_setting.setting_id).toBe(25);

			global_setting.set({ setting_name: 'description' });
			expect(global_setting.setting_name).toBe('description');

			global_setting.set({ category: 'general' });
			expect(global_setting.category).toBe('general');

			global_setting.set({ subcategory: 'problems' });
			expect(global_setting.subcategory).toBe('problems');

			global_setting.set({ default_value: 6 });
			expect(global_setting.default_value).toBe(6);

			global_setting.set({ description: 'This is the help.' });
			expect(global_setting.description).toBe('This is the help.');

			global_setting.set({ doc: 'This is the extended help.' });
			expect(global_setting.doc).toBe('This is the extended help.');

			global_setting.set({ type: 'int' });
			expect(global_setting.type).toBe(SettingType.int);

			global_setting.set({ type: 'undefined type' });
			expect(global_setting.type).toBe(SettingType.unknown);

		});

	});

	describe('Test the validity of settings', () => {
		test('test the validity of settings.', () => {
			const global_setting = new GlobalSetting();
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({
				setting_name: 'description',
				default_value: 'This is the description',
				description: 'Describe this.',
				doc: 'Extended help',
				type: 'text',
				category: 'general'
			});
			expect(global_setting.isValid()).toBe(true);

			global_setting.type = 'unknown_type';
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ type: 'list', description: '' });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ description: 'This is the help.', setting_name: '' });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ setting_name: 'description', category: '' });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ category: 'general', doc: '', type: 'text' });
			expect(global_setting.isValid()).toBe(true);

		});

		test('test the validity of global settings for default_value type text', () => {
			const global_setting = new GlobalSetting();
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({
				setting_name: 'description',
				default_value: 'This is the description',
				description: 'Describe this.',
				doc: 'Extended help',
				type: 'text',
				category: 'general'
			});

			expect(global_setting.isValid()).toBe(true);

			global_setting.set({ default_value: 3.14 });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ default_value: true });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ default_value: ['1', '2', '3'] });
			expect(global_setting.isValid()).toBe(false);
		});

		test('test the validity of global settings for default_value type int', () => {
			const global_setting = new GlobalSetting();
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({
				setting_name: 'number_1',
				default_value: 10,
				description: 'I am an integer',
				doc: 'Extended help',
				type: 'int',
				category: 'general'
			});

			expect(global_setting.isValid()).toBe(true);

			global_setting.set({ default_value: 3.14 });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ default_value: 'hi' });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ default_value: ['1', '2', '3'] });
			expect(global_setting.isValid()).toBe(false);
		});

		test('test the validity of global settings for default_value type decimal', () => {
			const global_setting = new GlobalSetting();
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({
				setting_name: 'number_1',
				default_value: 3.14,
				description: 'I am a decimal',
				doc: 'Extended help',
				type: 'decimal',
				category: 'general'
			});

			expect(global_setting.isValid()).toBe(true);

			global_setting.set({ default_value: 3 });
			expect(global_setting.isValid()).toBe(true);

			global_setting.set({ default_value: 'hi' });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ default_value: ['1', '2', '3'] });
			expect(global_setting.isValid()).toBe(false);

		});

		test('test the validity of global settings for default_value type list', () => {
			const global_setting = new GlobalSetting();
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({
				setting_name: 'the list',
				default_value: '1',
				description: 'I am a list',
				doc: 'Extended help',
				type: 'list',
				category: 'general'
			});

			// The options are missing
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ options: ['1', '2', '3'] });
			expect(global_setting.isValid()).toBe(true);

			global_setting.set({ default_value: 3.14 });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ default_value: 'hi' });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ default_value: ['1', '2', '3'] });
			expect(global_setting.isValid()).toBe(false);

			// Test the options with label/values
			global_setting.set({ options: [
				{ label: 'label1', value: '1' },
				{ label: 'label2', value: '2' },
				{ label: 'label3', value: '3' },
			], default_value: '2' });
			expect(global_setting.isValid()).toBe(true);
		});

		test('test the validity of global settings for default_value type multilist', () => {
			const global_setting = new GlobalSetting();
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({
				setting_name: 'my_multilist',
				default_value: ['1', '2'],
				description: 'I am a multilist',
				doc: 'Extended help',
				type: 'multilist',
				category: 'general'
			});

			// The options is missing, so not valid.
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ options: ['1', '2', '3'] });
			expect(global_setting.isValid()).toBe(true);

			global_setting.set({ default_value: 3.14 });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ default_value: 'hi' });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ default_value: ['1', '2', '4'] });
			expect(global_setting.isValid()).toBe(false);

			// Test the options in the form label/value
			global_setting.set({
				options: [
					{ label: 'option 1', value: '1' },
					{ label: 'option 2', value: '2' },
					{ label: 'option 3', value: '3' },
				],
				default_value: ['1', '3']
			});
			expect(global_setting.isValid()).toBe(true);

		});

		test('test the validity of global settings for default_value type boolean', () => {
			const global_setting = new GlobalSetting();
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({
				setting_name: 'a_boolean',
				default_value: true,
				description: 'I am true or false',
				doc: 'Extended help',
				type: 'boolean',
				category: 'general'
			});

			expect(global_setting.isValid()).toBe(true);

			global_setting.set({ default_value: 3.14 });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ default_value: 3 });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ default_value: ['1', '2', '3'] });
			expect(global_setting.isValid()).toBe(false);
		});

		test('test the validity of global settings for default_value type boolean', () => {
			const global_setting = new GlobalSetting();
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({
				setting_name: 'time_due',
				default_value: '23:59',
				description: 'The time that is due',
				doc: 'Extended help',
				type: 'time',
				category: 'general'
			});

			expect(global_setting.isValid()).toBe(true);

			global_setting.set({ default_value: 3.14 });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ default_value: '31:45' });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ default_value: '13:65' });
			expect(global_setting.isValid()).toBe(false);

			global_setting.set({ default_value: ['23:45'] });
			expect(global_setting.isValid()).toBe(false);
		});

	});

	const default_db_setting = {
		course_setting_id: 0,
		course_id: 0,
		setting_id: 0
	};

	describe('Create a new DBCourseSetting', () => {
		test('Create a default DBCourseSetting', () => {
			const setting = new DBCourseSetting();

			expect(setting).toBeInstanceOf(DBCourseSetting);
			expect(setting.toObject()).toStrictEqual(default_db_setting);
		});

		test('Create a new GlobalSetting', () => {
			const course_setting = new DBCourseSetting({
				course_setting_id: 10,
				course_id: 34,
				setting_id: 199,
				value: 'xyz'
			});

			expect(course_setting.course_setting_id).toBe(10);
			expect(course_setting.course_id).toBe(34);
			expect(course_setting.setting_id).toBe(199);
			expect(course_setting.value).toBe('xyz');
		});

		test('Check that calling all_fields() and params() is correct', () => {
			const settings_fields = ['course_setting_id', 'setting_id', 'course_id', 'value'];
			const setting = new DBCourseSetting();

			expect(setting.all_field_names.sort()).toStrictEqual(settings_fields.sort());
			expect(setting.param_fields.sort()).toStrictEqual([]);
			expect(DBCourseSetting.ALL_FIELDS.sort()).toStrictEqual(settings_fields.sort());
		});

		test('Check that cloning works', () => {
			const setting = new DBCourseSetting();
			expect(setting.clone().toObject()).toStrictEqual(default_db_setting);
			expect(setting.clone()).toBeInstanceOf(DBCourseSetting);
		});

	});

	describe('Updating db course settings', () => {
		test('set fields of a db course setting directly', () => {
			const course_setting = new DBCourseSetting();
			course_setting.course_setting_id = 10;
			expect(course_setting.course_setting_id).toBe(10);

			course_setting.setting_id = 25;
			expect(course_setting.setting_id).toBe(25);

			course_setting.course_id = 15;
			expect(course_setting.course_id).toBe(15);

			course_setting.value = 6;
			expect(course_setting.value).toBe(6);
		});

		test('set fields of a course setting using the set method', () => {
			const course_setting = new DBCourseSetting();

			course_setting.set({ course_setting_id:  10 });
			expect(course_setting.course_setting_id).toBe(10);

			course_setting.set({ setting_id:  25 });
			expect(course_setting.setting_id).toBe(25);

			course_setting.set({ course_id:  15 });
			expect(course_setting.course_id).toBe(15);

			course_setting.set({ value: 6 });
			expect(course_setting.value).toBe(6);
		});
	});

	const default_course_setting = {
		setting_id: 0,
		course_id: 0,
		course_setting_id: 0,
		setting_name: '',
		default_value: '',
		category: '',
		description: '',
		value: '',
		type: SettingType.unknown
	};

	describe('Create a new CourseSetting', () => {
		test('Create a default CourseSetting', () => {
			const setting = new CourseSetting();

			expect(setting).toBeInstanceOf(CourseSetting);
			expect(setting.toObject()).toStrictEqual(default_course_setting);
		});

		test('Create a new CourseSetting', () => {
			const course_setting = new CourseSetting({
				setting_id: 10,
				course_id: 5,
				course_setting_id: 17,
				value: 'this is my value',
				setting_name: 'description',
				default_value: 'This is the description',
				description: 'Describe this.',
				doc: 'Extended help',
				type: 'text',
				category: 'general'
			});

			expect(course_setting.setting_id).toBe(10);
			expect(course_setting.course_id).toBe(5);
			expect(course_setting.course_setting_id).toBe(17);
			expect(course_setting.value).toBe('this is my value');
			expect(course_setting.setting_name).toBe('description');
			expect(course_setting.default_value).toBe('This is the description');
			expect(course_setting.description).toBe('Describe this.');
			expect(course_setting.doc).toBe('Extended help');
			expect(course_setting.type).toBe(SettingType.text);
			expect(course_setting.category).toBe('general');
		});

		test('Check that calling all_fields() and params() is correct', () => {
			const settings_fields = ['setting_id', 'course_setting_id', 'course_id', 'value', 'setting_name',
				'default_value', 'category', 'subcategory', 'description', 'doc', 'type', 'options'];
			const setting = new CourseSetting();

			expect(setting.all_field_names.sort()).toStrictEqual(settings_fields.sort());
			expect(setting.param_fields.sort()).toStrictEqual([]);
			expect(CourseSetting.ALL_FIELDS.sort()).toStrictEqual(settings_fields.sort());
		});

		test('Check that cloning works', () => {
			const setting = new CourseSetting();
			expect(setting.clone().toObject()).toStrictEqual(default_course_setting);
			expect(setting.clone()).toBeInstanceOf(CourseSetting);
		});

	});

	describe('Updating course settings', () => {
		test('set fields of a course setting directly', () => {
			const course_setting = new CourseSetting();

			course_setting.setting_id = 25;
			expect(course_setting.setting_id).toBe(25);

			course_setting.course_id = 15;
			expect(course_setting.course_id).toBe(15);

			course_setting.value = 6;
			expect(course_setting.value).toBe(6);

			course_setting.setting_id = 10;
			expect(course_setting.setting_id).toBe(10);

			course_setting.setting_name = 'description';
			expect(course_setting.setting_name).toBe('description');

			course_setting.category = 'general';
			expect(course_setting.category).toBe('general');

			course_setting.subcategory = 'problems';
			expect(course_setting.subcategory).toBe('problems');

			course_setting.default_value = 6;
			expect(course_setting.default_value).toBe(6);

			course_setting.description = 'This is the help.';
			expect(course_setting.description).toBe('This is the help.');

			course_setting.doc = 'This is the extended help.';
			expect(course_setting.doc).toBe('This is the extended help.');

			course_setting.type = 'int';
			expect(course_setting.type).toBe(SettingType.int);

			course_setting.type = 'undefined type';
			expect(course_setting.type).toBe(SettingType.unknown);

		});

		test('set fields of a course setting using the set method', () => {
			const course_setting = new CourseSetting();

			course_setting.set({ course_setting_id:  10 });
			expect(course_setting.course_setting_id).toBe(10);

			course_setting.set({ setting_id:  25 });
			expect(course_setting.setting_id).toBe(25);

			course_setting.set({ course_id:  15 });
			expect(course_setting.course_id).toBe(15);

			course_setting.set({ value: 6 });
			expect(course_setting.value).toBe(6);

			course_setting.set({ setting_id:  25 });
			expect(course_setting.setting_id).toBe(25);

			course_setting.set({ setting_name: 'description' });
			expect(course_setting.setting_name).toBe('description');

			course_setting.set({ category: 'general' });
			expect(course_setting.category).toBe('general');

			course_setting.set({ subcategory: 'problems' });
			expect(course_setting.subcategory).toBe('problems');

			course_setting.set({ default_value: 6 });
			expect(course_setting.default_value).toBe(6);

			course_setting.set({ description: 'This is the help.' });
			expect(course_setting.description).toBe('This is the help.');

			course_setting.set({ doc: 'This is the extended help.' });
			expect(course_setting.doc).toBe('This is the extended help.');

			course_setting.set({ type: 'int' });
			expect(course_setting.type).toBe(SettingType.int);

			course_setting.set({ type: 'undefined type' });
			expect(course_setting.type).toBe(SettingType.unknown);

		});

	});

	describe('Test to determine that course settings overrides are working', () => {
		test('Test to determine that course settings overrides are working', () => {
			// If the Course Setting value is defined, then the value should be that.
			// If instead the value is undefined, use the default_value.

			const course_setting = new CourseSetting({
				setting_id: 10,
				course_id: 5,
				course_setting_id: 17,
				setting_name: 'description',
				default_value: 'This is the default value',
				description: 'Describe this.',
				doc: 'Extended help',
				type: 'text',
				category: 'general'
			});

			expect(course_setting.value).toBe('This is the default value');

			course_setting.value = 'This is the value.';
			expect(course_setting.value).toBe('This is the value.');
		});
	});

	describe('Test the validity of course settings', () => {
		test('test the basic validity of course settings.', () => {
			const course_setting = new CourseSetting();
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({
				setting_name: 'description',
				default_value: 'This is the description',
				description: 'Describe this.',
				doc: 'Extended help',
				type: 'text',
				category: 'general',
				value: 'my value'
			});
			expect(course_setting.isValid()).toBe(true);

			course_setting.type = 'unknown_type';
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ type: 'text', description: '' });
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ description: 'This is the help.', setting_name: '' });
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ setting_name: 'description', category: '' });
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ category: 'general', doc: '' });
			expect(course_setting.isValid()).toBe(true);

		});

		test('test the validity of course settings for default_value type int', () => {
			const course_setting = new CourseSetting();
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({
				setting_name: 'number_1',
				default_value: 10,
				description: 'I am an integer',
				doc: 'Extended help',
				type: 'int',
				category: 'general'
			});

			expect(course_setting.isValid()).toBe(true);

			course_setting.set({ value: 3.14 });
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ value: 'hi' });
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ value: ['1', '2', '3'] });
			expect(course_setting.isValid()).toBe(false);
		});

		test('test the validity of course settings for default_value type decimal', () => {
			const course_setting = new CourseSetting();
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({
				setting_name: 'number_1',
				default_value: 3.14,
				description: 'I am a decimal',
				doc: 'Extended help',
				type: 'decimal',
				category: 'general'
			});

			expect(course_setting.isValid()).toBe(true);

			course_setting.set({ value: 3 });
			expect(course_setting.isValid()).toBe(true);

			course_setting.set({ value: 'hi' });
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ value: ['1', '2', '3'] });
			expect(course_setting.isValid()).toBe(false);
		});

		test('test the validity of course settings for default_value type list', () => {
			const course_setting = new CourseSetting();
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({
				setting_name: 'the list',
				default_value: '1',
				description: 'I am a list',
				doc: 'Extended help',
				type: 'list',
				category: 'general'
			});

			// The options are missing
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ options: ['1', '2', '3'] });
			expect(course_setting.isValid()).toBe(true);

			course_setting.set({ value: 3.14 });
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ value: 'hi' });
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ value: ['1', '2', '3'] });
			expect(course_setting.isValid()).toBe(false);
		});

		test('test the validity of course settings for default_value type multilist', () => {
			const course_setting = new CourseSetting();
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({
				setting_name: 'my_multilist',
				default_value: ['1', '2'],
				description: 'I am a multilist',
				doc: 'Extended help',
				type: 'multilist',
				category: 'general'
			});

			// The options is missing, so not valid.
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ options: ['1', '2', '3'] });
			expect(course_setting.isValid()).toBe(true);

			course_setting.set({ value: 3.14 });
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ value: 'hi' });
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ value: ['1', '2', '4'] });
			expect(course_setting.isValid()).toBe(false);

			// Test the options in the form label/value
			course_setting.set({
				options: [
					{ label: 'option 1', value: '1' },
					{ label: 'option 2', value: '2' },
					{ label: 'option 3', value: '3' },
				]
			});
			expect(course_setting.isValid()).toBe(true);

		});

		test('test the validity of course settings for default_value type boolean', () => {
			const course_setting = new CourseSetting();
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({
				setting_name: 'a_boolean',
				default_value: true,
				description: 'I am true or false',
				doc: 'Extended help',
				type: 'boolean',
				category: 'general'
			});

			expect(course_setting.isValid()).toBe(true);

			course_setting.set({ value: 3.14 });
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ value: 3 });
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ value: ['1', '2', '3'] });
			expect(course_setting.isValid()).toBe(false);
		});

		test('test the validity of course settings for default_value type time_duration', () => {
			const course_setting = new CourseSetting();
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({
				setting_name: 'time_duration',
				default_value: '10 days',
				description: 'I am an time interval',
				doc: 'Extended help',
				type: 'time_duration',
				category: 'general'
			});

			expect(course_setting.isValid()).toBe(true);

			course_setting.set({ value: 3.14 });
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ value: 'hi' });
			expect(course_setting.isValid()).toBe(false);

			course_setting.set({ value: ['1', '2', '3'] });
			expect(course_setting.isValid()).toBe(false);
		});

	});
});