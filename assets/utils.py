import pandas as pd

@staticmethod
def create_dataframe(data):
    if data is not None:
        return pd.DataFrame(data)
    else:
        return pd.DataFrame()

# def get_data_from_cohort(cohort1, cohort2):
#     # stats = cohort1.get_concept_stats()
#     # print("DEBUG: type =", type(stats))
#     # print("DEBUG: keys =", list(stats.keys()))
#     # print("DEBUG: condition_occurence =", stats["condition_occurrence"])
#     df_concepts1 = create_dataframe(cohort1.get_concept_stats()['condition_occurrence'])
#     df_race_stats1 = create_dataframe(cohort1.get_stats('race'))
#     df_gender_dist1 = create_dataframe(cohort1.get_distributions('gender'))
#     df_age_dist1 = create_dataframe(cohort1.get_distributions('age'))
#     if cohort2 is not None:
#         df_concepts2 = create_dataframe(cohort2.get_concept_stats()['condition_occurrence'])
#         df_race_stats2 = create_dataframe(cohort2.get_stats('race'))
#         df_gender_dist2 = create_dataframe(cohort2.get_distributions('gender'))
#         df_age_dist2 = create_dataframe(cohort2.get_distributions('age'))
#     else:
#         df_concepts2 = create_dataframe(None)
#         df_race_stats2 = create_dataframe(None)
#         df_gender_dist2 = create_dataframe(None)
#         df_age_dist2 = create_dataframe(None)
#     # rename columns so that they can be passed to functions
#     df_race_stats1.rename(columns={'race': 'category', 'race_count': 'value'}, inplace=True)
#     df_gender_dist1.rename(columns={'gender': 'category', 'gender_count': 'value'}, inplace=True)
#     df_age_dist1.rename(columns={'age_bin': 'category', 'bin_count': 'value'}, inplace=True)
#     if not df_race_stats2.empty:
#         df_race_stats2.rename(columns={'race': 'category', 'race_count': 'value'}, inplace=True)
#     if not df_gender_dist2.empty:
#         df_gender_dist2.rename(columns={'gender': 'category', 'gender_count': 'value'}, inplace=True)
#     if not df_age_dist2.empty:
#         df_age_dist2.rename(columns={'age_bin': 'category', 'bin_count': 'value'}, inplace=True)
#     # print(df_race_stats1)
#     if not df_concepts2.empty:
#         # print(df_concepts2)
#         df_concepts1.rename(columns={'count_incohort': 'study_count', 'prevalence': 'study_prevalence'},
#                             inplace=True)
#         df_concepts2.rename(columns={'count_incohort': 'base_count', 'prevalence': 'base_prevalence'},
#                             inplace=True)
#         # print(df_concepts2)
#     return df_age_dist1, df_age_dist2, df_concepts1, df_concepts2, df_gender_dist1, df_gender_dist2, df_race_stats1, df_race_stats2