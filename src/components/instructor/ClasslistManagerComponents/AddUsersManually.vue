<template>
	<div>
		<q-card>
			<q-card-section>
				<div class="text-h6">Add Users</div>
			</q-card-section>

			<q-card-section class="q-pt-none">
				<div class="row">
					<div class="col">
						<q-input outlined v-model="course_user.username" label="Username" @blur="checkUser" />
					</div>
					<div class="col">
						<q-input outlined v-model="course_user.first_name" label="First Name" :disable="user_exists"/>
					</div>
					<div class="col">
						<q-input outlined v-model="course_user.last_name" label="Last Name" :disable="user_exists"/>
					</div>
					<div class="col">
						<q-input outlined v-model="course_user.email" label="Email" :disable="user_exists" />
					</div>
				</div>
				<div class="row">
					<div class="col">
						<q-input outlined v-model="course_user.student_id" label="Student ID" :disable="user_exists" />
					</div>
					<div class="col">
						<q-input outlined v-model="course_user.recitation" label="Recitation" :disable="user_exists" />
					</div>
					<div class="col">
						<q-input outlined v-model="course_user.section" label="Section" :disable="user_exists" />
					</div>
					<div class="col">
						<q-select outlined v-model="course_user.role" :options="roles" label="Role" />
					</div>
				</div>
			</q-card-section>

			<q-card-actions align="right" class="bg-white text-teal">
				<q-btn flat label="Add This User and Another One" @click="addUser(false)" />
				<q-btn flat label="Add This User and Close" @click="addUser(true)" />
				<q-btn flat label="Cancel" v-close-popup />
			</q-card-actions>
		</q-card>
	</div>
</template>

<script lang="ts">
import type { Ref } from 'vue';
import { defineComponent, ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { logger } from 'boot/logger';

import { useRoute } from 'vue-router';
import { useStore } from 'src/store';
import { newMergedUser } from 'src/store/utils/users';

import { CourseSetting, User, MergedUser, ResponseError } from 'src/store/models';
import { AxiosError } from 'axios';
import { isArray, remove, clone } from 'lodash';

export default defineComponent({
	name: 'AddUsersManually',
	emits: ['closeDialog'],
	setup(props, context) {
		const $q = useQuasar();
		const course_user: Ref<MergedUser> = ref(newMergedUser());
		const user_exists: Ref<boolean> = ref(true);
		const store = useStore();
		const route = useRoute();

		return {
			course_user,
			user_exists,
			// see if the user exists already and fill in the known fields
			checkUser: async () => {
				try {
					const _user = await store.dispatch('users/getUser', course_user.value.username) as User;
					user_exists.value = true;
					course_user.value.user_id = _user.user_id;
					course_user.value.username = _user.username;
					course_user.value.first_name = _user.first_name;
					course_user.value.last_name = _user.last_name;
					course_user.value.email = _user.email;
				} catch (err) {
					const error = err as ResponseError;
					// this will occur is the user is not a global user
					if (error.exception === 'DB::Exception::UserNotFound') {
						user_exists.value = false;
					} else {
						logger.error(error.message);
					}
				}
			},
			roles: computed(() => { // return an array of the roles in the course
				const all_roles = store.state.settings.course_settings.find(
					(_setting: CourseSetting) => _setting.var === 'roles'
				);
				const r = clone(all_roles?.value as Array<string>);
				remove(r, (v)=> v==='admin'); // don't allow to set admin level here.
				return r;
			}),
			addUser: async (close: boolean) => {
				try {
					const course_id = isArray(route.params.course_id) ?
						route.params.course_id[0] :
						route.params.course_id;
					course_user.value.course_id = parseInt(course_id);
					await store.dispatch('users/addMergedUser', course_user.value);
					$q.notify({
						message: `The user with username '${course_user.value.username}' was added successfully.`,
						color: 'green'
					});
					if (close) {
						context.emit('closeDialog');
					} else {
						course_user.value = newMergedUser();
					}
				} catch (err) {
					const error = err as AxiosError;
					logger.error(error);
					const data = error?.response?.data as ResponseError || { exception: '' };
					$q.notify({
						message: data.exception,
						color: 'red'
					});
				}
			}
		};
	}
});
</script>
