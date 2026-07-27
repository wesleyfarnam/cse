<template>
	<SkeletonLoader v-if="!course.data" variant="course-page" />
	<div v-else class="cse-cd">
		<!-- ===== Navy hero ===== -->
		<div class="cse-hero">
			<div class="cse-hero-grid">
				<div class="cse-hero-main">
					<div v-if="course.data.tags" class="flex flex-wrap gap-2 mb-4">
						<span
							v-for="tag in course.data.tags.split(', ')"
							:key="tag"
							class="cse-htag"
						>
							{{ tag }}
						</span>
					</div>
					<h1 class="cse-htitle">{{ course.data.title }}</h1>
					<p v-if="course.data.short_introduction" class="cse-hintro">
						{{ course.data.short_introduction }}
					</p>
					<div class="cse-hmeta">
						<template v-if="Number(course.data.rating) > 0">
							<span class="cse-hmeta-item">
								<Star class="size-4" style="color:#E8A33D;fill:#E8A33D" />
								<b>{{ formatRating(course.data.rating) }}</b>
								<span v-if="course.data.rating_count" class="cse-hmeta-dim">
									({{ formatAmount(course.data.rating_count) }})
								</span>
							</span>
						</template>
						<span v-if="course.data.enrollments" class="cse-hmeta-item">
							<UsersRound class="size-4 stroke-[1.5]" />
							{{ formatAmount(course.data.enrollments) }} {{ __('Students') }}
						</span>
						<span
							v-if="course.data.instructors?.length"
							class="cse-hmeta-item"
						>
							<span
								class="h-6 me-1"
								:class="{ 'avatar-group overlap': course.data.instructors.length > 1 }"
							>
								<UserAvatar
									v-for="instructor in course.data.instructors"
									:key="instructor.name"
									:user="instructor"
								/>
							</span>
							<CourseInstructors :instructors="course.data.instructors" />
						</span>
					</div>
				</div>
				<div class="cse-hero-aside">
					<CourseCardOverlay :course="course" />
				</div>
			</div>
		</div>

		<!-- ===== Light body ===== -->
		<div class="cse-body">
			<div class="cse-body-grid">
				<div class="cse-body-main">
					<section>
						<div class="cse-h2row">
							<div class="cse-hbar"></div>
							<h2 class="cse-h2">{{ __('Course content') }}</h2>
							<div class="cse-h2stats">{{ outlineStats }}</div>
						</div>
						<div class="cse-card p-2">
							<SkeletonLoader
								v-if="outline.loading && !outline.data"
								variant="list"
								:count="6"
							/>
							<div
								v-else-if="!hasCourseContent"
								class="flex items-center justify-center px-4 py-10 text-center"
							>
								<span class="text-sm text-ink-gray-5">{{ __('Course Content coming soon!') }}</span>
							</div>
							<CourseOutline
								v-else
								:courseName="course.data.name"
								:getProgress="course.data.membership ? true : false"
								:editorLinks="isCourseAdmin"
							/>
						</div>
					</section>

					<section v-if="course.data.description" class="mt-10">
						<div class="cse-h2row">
							<div class="cse-hbar"></div>
							<h2 class="cse-h2">{{ __('About this course') }}</h2>
						</div>
						<div
							v-html="course.data.description"
							class="ProseMirror prose prose-sm max-w-none !whitespace-normal prose-table:table-fixed prose-td:p-2 prose-th:p-2 prose-td:border prose-th:border prose-td:border-outline-gray-2 prose-th:border-outline-gray-2 prose-td:relative prose-th:relative prose-th:bg-surface-gray-2 mt-4"
						/>
					</section>

					<div class="mt-10">
						<CourseReviews
							:courseName="course.data.name"
							:avg_rating="course.data.rating"
							:membership="course.data.membership || null"
						/>
					</div>
				</div>

				<aside class="cse-body-aside">
					<CourseCreatorCard :instructors="course.data.instructors || []" />
				</aside>
			</div>

			<RelatedCourses :courseName="course.data.name" class="mt-12" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { createResource, Badge } from 'frappe-ui'
import { Star, UsersRound } from 'lucide-vue-next'
import { formatAmount, formatRating } from '@/utils/'
import type { SessionUser } from '@/types/api'
import CourseCardOverlay from '@/components/CourseCardOverlay.vue'
import CourseOutline from '@/components/CourseOutline.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import CourseReviews from '@/components/CourseReviews.vue'
import CourseInstructors from '@/components/CourseInstructors.vue'
import CourseCreatorCard from '@/components/CourseCreatorCard.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import RelatedCourses from '@/components/RelatedCourses.vue'
import type { CourseDetails, OutlineChapter, Resource } from '@/types/api'

const props = defineProps<{
	course: Resource<CourseDetails | null>
}>()

const user = inject<SessionUser>('$user')

const isCourseInstructor = computed<boolean>(() =>
	(props.course.data?.instructors || []).some((i) => i.name === user?.data?.name)
)

const isCourseAdmin = computed<boolean>(
	() => Boolean(user?.data?.is_moderator) || isCourseInstructor.value
)

const outline = createResource({
	url: 'lms.lms.utils.get_course_outline',
	cache: ['course_outline', props.course.data?.name],
	makeParams() {
		return { course: props.course.data?.name, progress: false }
	},
	auto: true,
}) as Resource<OutlineChapter[]>

const outlineStats = computed(() => {
	const chapters = outline.data || []
	const lessonCount = chapters.reduce((acc, c) => acc + (c.lessons?.length || 0), 0)
	const parts: string[] = []
	if (chapters.length) {
		parts.push(`${chapters.length} ${chapters.length === 1 ? __('section') : __('sections')}`)
	}
	if (lessonCount) {
		parts.push(`${lessonCount} ${lessonCount === 1 ? __('lesson') : __('lessons')}`)
	}
	return parts.join(' · ')
})

const hasCourseContent = computed(() => {
	const chapters = outline.data || []
	const lessonCount = chapters.reduce((acc, c) => acc + (c.lessons?.length || 0), 0)
	return chapters.length > 0 && lessonCount > 0
})
</script>

<style scoped>
.cse-cd { display: flex; flex-direction: column; }
/* ---- Navy hero ---- */
.cse-hero {
	background: #131c3f;
	position: relative;
	overflow: hidden;
	padding: 40px clamp(20px, 4vw, 48px) 48px;
}
.cse-hero::before {
	content: ''; position: absolute; inset: 0;
	background: radial-gradient(120% 100% at 90% 4%, rgba(240,71,82,.16), rgba(255,255,255,0) 55%),
	            radial-gradient(110% 90% at 4% 100%, rgba(47,84,208,.15), rgba(255,255,255,0) 55%);
}
.cse-hero-grid {
	position: relative; display: flex; gap: 40px; align-items: flex-start; max-width: 1200px;
}
@media (max-width: 900px) { .cse-hero-grid { flex-direction: column; } }
.cse-hero-main { flex: 1; min-width: 0; }
.cse-hero-aside { width: 320px; flex: none; }
@media (max-width: 900px) { .cse-hero-aside { width: 100%; } }
.cse-htag {
	font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
	background: rgba(240,71,82,.16); color: #FF8A93; padding: 4px 9px; border-radius: 999px;
}
.cse-htitle {
	font-family: var(--cse-font-display, 'Saira Condensed'), sans-serif;
	font-weight: 700; text-transform: uppercase; letter-spacing: .01em; color: #fff;
	font-size: clamp(34px, 5vw, 52px); line-height: 1.04;
}
.cse-hintro { font-size: 15.5px; color: #A9B2D0; line-height: 1.65; margin-top: 16px; max-width: 560px; }
.cse-hmeta { display: flex; flex-wrap: wrap; align-items: center; gap: 18px; margin-top: 20px; }
.cse-hmeta-item { display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 600; color: #A9B2D0; }
.cse-hmeta-item :deep(*) { color: #A9B2D0; }
.cse-hmeta-item b { color: #fff; font-weight: 700; }
.cse-hmeta-dim { color: #6E7AA3; }
/* keep the enroll card readable (it's a light card) */
.cse-hero-aside :deep(.text-ink-gray-9) { color: #111a33; }

/* ---- Light body ---- */
.cse-body { background: #f6f7f9; padding: 40px clamp(20px, 4vw, 48px) 56px; }
.cse-body-grid { display: flex; gap: 40px; align-items: flex-start; max-width: 1200px; }
@media (max-width: 900px) { .cse-body-grid { flex-direction: column; } }
.cse-body-main { flex: 1; min-width: 0; }
.cse-body-aside { width: 320px; flex: none; position: sticky; top: 20px; }
@media (max-width: 900px) { .cse-body-aside { width: 100%; position: static; } }
.cse-h2row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.cse-hbar { width: 4px; height: 24px; background: #db2b3a; border-radius: 2px; flex: none; }
.cse-h2 {
	font-family: var(--cse-font-display, 'Saira Condensed'), sans-serif;
	font-weight: 700; font-size: 24px; letter-spacing: .03em; text-transform: uppercase; color: #131c3f;
}
.cse-h2stats { margin-left: auto; font-size: 14px; color: #97a0b5; font-weight: 600; }
.cse-card { background: #fff; border: 1px solid #e6e9f0; border-radius: 16px; box-shadow: 0 1px 2px rgba(16,26,51,.04); }
</style>
