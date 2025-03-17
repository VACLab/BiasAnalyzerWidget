# from typing import Any

import anywidget
import traitlets
import pandas as pd
import pathlib

# converts pandas DataFrame to JSON
def to_json(instance: dict, widget) -> list[dict]:
    return {"df": instance["df"].to_json(orient="records")}

# Inherits from AnyWidget
class CohortWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "index.js"
    _css = pathlib.Path(__file__).parent / "index.css"

    # _cohort1 = traitlets.Dict().tag(sync=True, to_json=to_json)
    _concepts1 = traitlets.Dict().tag(sync=True, to_json=to_json)
    _race_stats1 = traitlets.Dict().tag(sync=True, to_json=to_json)
    _gender_dist1 = traitlets.Dict().tag(sync=True, to_json=to_json)
    _age_dist1 = traitlets.Dict().tag(sync=True, to_json=to_json)

    # _cohort2 = traitlets.Dict().tag(sync=True, to_json=to_json)
    _concepts2 = traitlets.Dict().tag(sync=True, to_json=to_json)
    _race_stats2 = traitlets.Dict().tag(sync=True, to_json=to_json)
    _gender_dist2 = traitlets.Dict().tag(sync=True, to_json=to_json)
    _age_dist2 = traitlets.Dict().tag(sync=True, to_json=to_json)

    def __init__(self, concepts1, race_stats1, gender_dist1, age_dist1,
                 concepts2, race_stats2, gender_dist2, age_dist2):
        super().__init__(
                            # _cohort1={'df': cohort1},
                            _concepts1={'df': concepts1},
                            _race_stats1={'df': race_stats1},
                            _gender_dist1={'df': gender_dist1},
                            _age_dist1={'df': age_dist1},
                            # _cohort2={'df': cohort2},
                            _concepts2={'df': concepts2},
                            _race_stats2={'df': race_stats2},
                            _gender_dist2={'df': gender_dist2},
                            _age_dist2={'df': age_dist2}
                        )
        # print('Here I am!')

# TODO: Try to simplify by removing this function. I think that this function will be unnecessary if I pass the
#       variable values directly to the widget as JSON. We don't need to convert JSON to dataframes, then back
#       to JSON again. Getting rid of this will speed-up the visualization, and make the usage easier.

# def cohort_widget(cohort1, concepts1, race_stats1, gender_dist1, age_dist1,
#                   cohort2=None, concepts2=None, race_stats2=None, gender_dist2=None, age_dist2=None):
def cohort_widget(concepts1, race_stats1, gender_dist1, age_dist1,
                  concepts2=None, race_stats2=None, gender_dist2=None, age_dist2=None):

    def create_dataframe(data):
        if data is not None:
            return pd.DataFrame(data)
        else:
            return pd.DataFrame()

    # df_cohort1 = create_dataframe(cohort1)
    df_concepts1 = create_dataframe(concepts1)
    df_race_stats1 = create_dataframe(race_stats1)
    df_gender_dist1 = create_dataframe(gender_dist1)
    df_age_dist1 = create_dataframe(age_dist1)

    # df_cohort2 = create_dataframe(cohort2)
    df_concepts2 = create_dataframe(concepts2)
    df_race_stats2 = create_dataframe(race_stats2)
    df_gender_dist2 = create_dataframe(gender_dist2)
    df_age_dist2 = create_dataframe(age_dist2)

    # rename columns so that they can be passed to functions
    df_race_stats1.rename(columns={'race': 'category', 'race_count': 'value'}, inplace=True)
    df_gender_dist1.rename(columns={'gender': 'category', 'gender_count': 'value'}, inplace=True)
    df_age_dist1.rename(columns={'age_bin': 'category', 'bin_count': 'value'}, inplace=True)

    if not df_race_stats2.empty:
        df_race_stats2.rename(columns={'race': 'category', 'race_count': 'value'}, inplace=True)
    if not df_gender_dist2.empty:
        df_gender_dist2.rename(columns={'gender': 'category', 'gender_count': 'value'}, inplace=True)
    if not df_age_dist2.empty:
        df_age_dist2.rename(columns={'age_bin': 'category', 'bin_count': 'value'}, inplace=True)

    if not df_concepts2.empty:
        df_concepts1.rename(columns={'count_in_cohort': 'study_count', 'prevalence': 'study_prevalence'}, inplace=True)
        df_concepts2.rename(columns={'count_in_cohort': 'base_count', 'prevalence': 'base_prevalence'}, inplace=True)

    return CohortWidget(
                        # cohort1=df_cohort1,
                        concepts1=df_concepts1,
                        race_stats1=df_race_stats1,
                        gender_dist1=df_gender_dist1,
                        age_dist1=df_age_dist1,

                        # cohort2=df_cohort2,
                        concepts2=df_concepts2,
                        race_stats2=df_race_stats2,
                        gender_dist2=df_gender_dist2,
                        age_dist2=df_age_dist2
                        )
