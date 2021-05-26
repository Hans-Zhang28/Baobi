module "video_insights" {
  source              = "./modules/boolean-feature"
  project_key         = data.launchdarkly_project.default.key
  feature_name        = "Video Insights"
  feature_key         = "video_insights"
  feature_description = "Enables Video Insights"
  team                = "sales"
}