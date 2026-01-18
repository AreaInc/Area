-- Seed services data
INSERT INTO "services" ("provider", "name", "description", "image_url", "version", "supported_actions", "credential_types", "is_active")
VALUES
  ('gmail', 'Gmail', 'Send and receive emails using Gmail.', 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg', '1.0.0', '["send_email", "read_email"]'::jsonb, '["oauth2"]'::jsonb, true),
  ('google_sheets', 'Google Sheets', 'Create and manage spreadsheets.', 'https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg', '1.0.0', '["create_document", "add_row", "update_cell", "read_range"]'::jsonb, '["oauth2"]'::jsonb, true),
  ('spotify', 'Spotify', 'Play music, manage playlists, and more.', 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg', '1.0.0', '["play_music", "add_to_playlist", "create_document", "skip_track", "pause_playback", "like_current_track"]'::jsonb, '["oauth2"]'::jsonb, true),
  ('twitch', 'Twitch', 'Interact with live streams and chat.', 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Twitch_Glitch_Logo_purple.svg', '1.0.0', '["update_stream_title", "send_chat_message", "create_clip", "start_commercial", "create_stream_marker"]'::jsonb, '["oauth2"]'::jsonb, true),
  ('youtube', 'YouTube', 'Manage videos, playlists, and subscriptions.', 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg', '1.0.0', '["create_document", "delete_document", "rate_video", "subscribe_channel", "unsubscribe_channel", "comment_video"]'::jsonb, '["oauth2"]'::jsonb, true),
  ('github', 'GitHub', 'Manage repositories, issues, and pull requests.', 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg', '1.0.0', '["create_issue", "add_comment", "star_repository", "create_repository", "add_label", "close_issue", "create_pull_request", "merge_pull_request"]'::jsonb, '["oauth2"]'::jsonb, true)
ON CONFLICT ("provider") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "image_url" = EXCLUDED."image_url",
  "version" = EXCLUDED."version",
  "supported_actions" = EXCLUDED."supported_actions",
  "credential_types" = EXCLUDED."credential_types",
  "is_active" = EXCLUDED."is_active",
  "updated_at" = NOW();
