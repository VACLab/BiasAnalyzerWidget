# from typing import Any

import anywidget
import traitlets
import pandas as pd
import pathlib

# Inherits from AnyWidget
class CohortWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "index.js"
    _css = pathlib.Path(__file__).parent / "index.css"
    initialized = traitlets.Bool(default_value=False).tag(sync=True)

    def __init__(self, cohort1, cohort2=None, cohort1_name='study_cohort', cohort2_name='baseline_cohort'):
        super().__init__()
        self._cohort1 = cohort1
        self._cohort1_name = cohort1_name
        self._cohort2 = cohort2
        self._cohort2_name = cohort2_name

        self.initialized = True

    @staticmethod
    def create_dataframe(data):
        if data is not None:
            return pd.DataFrame(data)
        else:
            return pd.DataFrame()

    def create_trait(self, name, trait_type, value):
        self.add_traits(**{name: trait_type.tag(sync=True)})
        setattr(self, name, value)

    @traitlets.observe('initialized')
    def _on_initialized(self, change):
        if change['new']:
            self.on_initialized()

    def on_initialized(self):
        # Perform actions that require the widget to be fully initialized
        self.init_widget()

    def init_widget(self):

        # The reason for converting to df is to do a little bit of data manipulation.

        df_concepts1 = self.create_dataframe(self._cohort1.get_concept_stats()['condition_occurrence'])
        df_race_stats1 = self.create_dataframe(self._cohort1.get_stats('race'))
        df_gender_dist1 = self.create_dataframe(self._cohort1.get_distributions('gender'))
        df_age_dist1 = self.create_dataframe(self._cohort1.get_distributions('age'))
        if self._cohort2 is not None:
            df_concepts2 = self.create_dataframe(self._cohort2.get_concept_stats()['condition_occurrence'])
            df_race_stats2 = self.create_dataframe(self._cohort2.get_stats('race'))
            df_gender_dist2 = self.create_dataframe(self._cohort2.get_distributions('gender'))
            df_age_dist2 = self.create_dataframe(self._cohort2.get_distributions('age'))
        else:
            df_concepts2 = self.create_dataframe(None)
            df_race_stats2 = self.create_dataframe(None)
            df_gender_dist2 = self.create_dataframe(None)
            df_age_dist2 = self.create_dataframe(None)

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
        # print(df_race_stats1)

        if not df_concepts2.empty:
            # print(df_concepts2)
            df_concepts1.rename(columns={'count_in_cohort':  'study_count', 'prevalence':  'study_prevalence'},
                                inplace=True)
            df_concepts2.rename(columns={'count_in_cohort':  'base_count', 'prevalence':  'base_prevalence'},
                                inplace=True)
            # print(df_concepts2)

        # Give data to traitlets as lists of dictionaries.

        self.create_trait('_concepts1', traitlets.List(traitlets.Dict()),
                          df_concepts1.to_dict(orient='records'))
        self.create_trait('_race_stats1', traitlets.List(traitlets.Dict()),
                          df_race_stats1.to_dict(orient='records'))
        self.create_trait('_gender_dist1', traitlets.List(traitlets.Dict()),
                          df_gender_dist1.to_dict(orient='records'))
        self.create_trait('_age_dist1', traitlets.List(traitlets.Dict()),
                          df_age_dist1.to_dict(orient='records'))

        self.create_trait('_concepts2', traitlets.List(traitlets.Dict()),
                          df_concepts2.to_dict(orient='records'))
        self.create_trait('_race_stats2', traitlets.List(traitlets.Dict()),
                          df_race_stats2.to_dict(orient='records'))
        self.create_trait('_gender_dist2', traitlets.List(traitlets.Dict()),
                          df_gender_dist2.to_dict(orient='records'))
        self.create_trait('_age_dist2', traitlets.List(traitlets.Dict()),
                          df_age_dist2.to_dict(orient='records'))

        # print("initialization completed")
