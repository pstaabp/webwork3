<template>
<div class="q-pa-md">
	<div class="row" v-if="user !== undefined">
		<h3> Welcome {{user.first_name}} {{user.last_name}} </h3>
	</div>

	<div class="row">
		<p>Select a course below:</p>
	</div>
	<div class="q-pa-md row items-start q-gutter-md">
		<q-card>
			<q-card-section>
				<div class="text-h4">Courses as a Student</div>
			</q-card-section>
			<div class="q-pa-md">
				<q-card-section>
					<q-list>
						<template v-for="course in student_courses" :key="course.course_id">
							<q-item
								:to="{
									 name: 'student',
									 params: { course_id: course.course_id, course_name: course.course_name }
									 }"
								>
								<q-item-section>
									<q-item-label>{{ course.course_name }}</q-item-label>
								</q-item-section>
							</q-item>
						</template>
					</q-list>
				</q-card-section>
			</div>
		</q-card>
		<q-card>
			<q-card-section>
				<div class="text-h4">Courses as an Instructor</div>
			</q-card-section>
			<div class="q-pa-md">
				<q-card-section>
					<q-list>
						<template v-for="course in instructor_courses" :key="course.course_id">
							<q-item
								:to="{
									 name: 'instructor',
									 params: { course_id: course.course_id, course_name: course.course_name }
									 }"
								>
								<q-item-section>
									<q-item-label>{{ course.course_name }}</q-item-label>
								</q-item-section>
							</q-item>
						</template>
					</q-list>
				</q-card-section>
			</div>
		</q-card>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
// import { useRoute } from 'vue-router';
import { useStore } from 'src/store';

import { UserCourse } from 'src/store/models';

export default defineComponent({
	name: 'UserCourses',
	setup() {
		const store = useStore();
		return {
			student_courses: computed(() =>
				store.state.users.user_courses.filter((user: UserCourse) => user.role === 'student')
			),
			instructor_courses: computed(() =>
				store.state.users.user_courses.filter((user: UserCourse) => user.role === 'instructor')
			),
			user: computed(() => store.state.session.user)
		};
	},
	async created() {
		// fetch the data when the view is created and the data is
		// already being observed
		const store = useStore();
		await store.dispatch('users/fetchUserCourses', store.state.session.user.user_id);
	}
});
</script>
