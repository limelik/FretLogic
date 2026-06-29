# Database Schema

## `users`

| column | type | notes |
|---|---|---|
| id | bigint | PK |
| display_name | varchar | player name |
| email | varchar | unique |
| password_hash | varchar | BCrypt hash |
| role | varchar | default `ROLE_USER` |
| profile_headline | varchar(240) | profile subtitle |
| avatar_gradient | varchar | UI accent string |
| created_at | timestamp | created |
| updated_at | timestamp | updated |

## `saved_progress`

| column | type | notes |
|---|---|---|
| id | bigint | PK |
| user_id | bigint | unique FK -> users |
| last_visited_exercise | varchar | page restore |
| note_machine_state_json | text | note drill restore |
| scale_machine_state_json | text | scale restore |
| saved_settings_json | text | shared settings |
| active_tuning | varchar | current tuning |
| show_note_labels | boolean | UI state |
| selected_scale_type | varchar | restore |
| selected_root_note | varchar | restore |
| updated_at | timestamp | last sync |

## `practice_sessions`

| column | type | notes |
|---|---|---|
| id | bigint | PK |
| user_id | bigint | FK -> users |
| exercise_type | varchar | enum |
| started_at | timestamp | start |
| ended_at | timestamp | end |
| score | integer | points |
| correct_answers | integer | count |
| total_questions | integer | count |
| accuracy | double | derived |
| settings_snapshot_json | text | drill settings |

## `exercise_results`

| column | type | notes |
|---|---|---|
| id | bigint | PK |
| user_id | bigint | FK -> users |
| exercise_type | varchar | enum |
| prompt_label | varchar | shown prompt |
| expected_answer | varchar | expected |
| submitted_answer | varchar | selected |
| correct | boolean | hit/miss |
| response_time_ms | bigint | latency |
| score_delta | integer | point delta |
| metadata_json | text | note/string/fret info |
| created_at | timestamp | created |

## `scales`

| column | type | notes |
|---|---|---|
| id | bigint | PK |
| user_id | bigint | FK -> users |
| root_note | varchar | root |
| scale_type | varchar | formula key |
| note_names_json | text | generated notes |
| intervals_json | text | degree labels |
| tuning_name | varchar | tuning id |
| fret_range | integer | visual range |
| created_at | timestamp | created |

## `favorite_scales`

| column | type | notes |
|---|---|---|
| id | bigint | PK |
| user_id | bigint | FK -> users |
| scale_id | bigint | FK -> scales |
| nickname | varchar | custom label |
| created_at | timestamp | created |
| last_practiced_at | timestamp | last use |
