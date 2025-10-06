import anywidget
import traitlets as t
import pathlib
from datetime import datetime, date
from decimal import Decimal

class ViewCohorts(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "index.js"
    _css = pathlib.Path(__file__).parent / "index.css"
    initialized = t.Bool(default_value=False).tag(sync=True)

    # List of developer-only keys
    _dev_keys = [
        'cohort1_meta', 'cohort1_stats', 'concepts1', 'race_stats1', 'ethnicity_stats1', 'gender_dist1', 'age_dist1',
        'cohort2_meta', 'cohort2_stats', 'concepts2', 'race_stats2', 'ethnicity_stats2', 'gender_dist2', 'age_dist2'
    ]

    @staticmethod
    def is_empty(obj):
        return True if obj is None or len(obj) == 0 else False

    def make_json_serializable(self, obj):
        """Convert non-JSON-serializable objects to JSON-compatible types."""
        if isinstance(obj, dict):
            return {key: self.make_json_serializable(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self.make_json_serializable(item) for item in obj]
        elif isinstance(obj, (datetime, date)):
            return obj.isoformat()
        elif isinstance(obj, Decimal):
            return float(obj)
        elif hasattr(obj, '__dict__'):
            return self.make_json_serializable(obj.__dict__)
        else:
            return obj

    def __init__(
            self,
            cohort1=None,
            cohort2=None,
            cohort1_shortname='study cohort',
            cohort2_shortname='baseline cohort',
            **kwargs
    ):
        # Determine if developer kwargs were passed
        self.is_json_mode = any(k in kwargs and kwargs[k] is not None for k in ViewCohorts._dev_keys)

        # Require cohort1 if no developer data
        if not self.is_json_mode and cohort1 is None:
            raise ValueError(
                "Cohort1 cannot be empty. At least one cohort is needed."
            )

        super().__init__()

        # parameters
        self._cohort1 = cohort1
        self._cohort2 = cohort2
        self._cohort1_shortname = cohort1_shortname
        self._cohort2_shortname = cohort2_shortname

        # developer parameters
        self._cohort1_meta = kwargs.get('cohort1_metadata')
        self._cohort1_stats = kwargs.get('cohort1_stats')
        self._concepts1 = kwargs.get('concepts1')
        self._race_stats1 = kwargs.get('race_stats1')
        self._ethnicity_stats1 = kwargs.get('ethnicity_stats1')
        self._gender_dist1 = kwargs.get('gender_dist1')
        self._age_dist1 = kwargs.get('age_dist1')

        self._cohort2_meta = kwargs.get('cohort2_metadata')
        self._cohort2_stats = kwargs.get('cohort2_stats')
        self._concepts2 = kwargs.get('concepts2')
        self._race_stats2 = kwargs.get('race_stats2')
        self._ethnicity_stats2 = kwargs.get('ethnicity_stats2')
        self._gender_dist2 = kwargs.get('gender_dist2')
        self._age_dist2 = kwargs.get('age_dist2')

        self.initialized = True

    def create_trait(self, name, trait_type, value):
        if not value is None:
            self.add_traits(**{name: trait_type.tag(sync=True)})
            setattr(self, name, value)

    @t.observe('initialized')
    def _on_initialized(self, change):
        if change['new']:
            self.on_initialized()

    def on_initialized(self):
        # Perform actions that require the widget to be fully initialized
        self.init_widget()

    def init_widget(self):
        # if we are not injecting json, get the datasets
        # we are also serializing so that object fields (e.g., dates) can be passed to javascript
        if not self.is_json_mode:
            self._cohort1_meta = self.make_json_serializable(self._cohort1.metadata)
            self._cohort1_stats = self.make_json_serializable(self._cohort1.get_stats())
            self._concepts1 = self.make_json_serializable(self._cohort1.get_concept_stats(
                concept_type='condition_occurrence')[0]['condition_occurrence'])
            self._race_stats1 = self.make_json_serializable(self._cohort1.get_stats('race'))
            self._ethnicity_stats1 = self.make_json_serializable(self._cohort1.get_stats('ethnicity'))
            self._gender_dist1 = self.make_json_serializable(self._cohort1.get_distributions('gender'))
            self._age_dist1 = self.make_json_serializable(self._cohort1.get_distributions('age'))

            if self._cohort2 is not None:
                self._cohort2_meta = self.make_json_serializable(self._cohort2.metadata)
                self._cohort2_stats = self.make_json_serializable(self._cohort2.get_stats())
                self._concepts2 = self.make_json_serializable(self._cohort2.get_concept_stats(
                    concept_type='condition_occurrence')[0]['condition_occurrence'])
                self._race_stats2 = self.make_json_serializable(self._cohort2.get_stats('race'))
                self._ethnicity_stats2 = self.make_json_serializable(self._cohort2.get_stats('ethnicity'))
                self._gender_dist2 = self.make_json_serializable(self._cohort2.get_distributions('gender'))
                self._age_dist2 = self.make_json_serializable(self._cohort2.get_distributions('age'))

        # Give data to traitlets, mostly as lists of dictionaries -- exceptions are metadata & shortname

        # print(f'self._cohort1_meta = {self._cohort1_meta}')
        self.create_trait('_cohort1_meta', t.Dict(), self._cohort1_meta)
        # print(f'self._cohort1_stats = {self._cohort1_stats}')
        self.create_trait('_cohort1_stats', t.List(t.Dict()), self._cohort1_stats)
        # print(f'self._concepts1 = {self._concepts1}')
        self.create_trait('_concepts1', t.List(t.Dict()), self._concepts1)
        # print(f'self._race_stats1 = {self._race_stats1}')
        self.create_trait('_race_stats1', t.List(t.Dict()), self._race_stats1)
        # print(f'self._ethnicity_stats1 = {self._ethnicity_stats1}')
        self.create_trait('_ethnicity_stats1', t.List(t.Dict()), self._ethnicity_stats1)
        # print(f'self._gender_dist1 = {self._gender_dist1}')
        self.create_trait('_gender_dist1', t.List(t.Dict()), self._gender_dist1)
        # print(f'self._age_dist1 = {self._age_dist1}')
        self.create_trait('_age_dist1', t.List(t.Dict()), self._age_dist1)
        self.create_trait('_cohort1_shortname', t.Unicode(), self._cohort1_shortname)

        # assumption is that if we have the meta, we have everything else too
        if not self.is_empty(self._cohort2_meta):
            # print(f'self._cohort2_meta = {self._cohort2_meta}')
            self.create_trait('_cohort2_meta', t.Dict(), self._cohort2_meta)
            # print(f'self._cohort2_stats = {self._cohort2_stats}')
            self.create_trait('_cohort2_stats', t.List(t.Dict()), self._cohort2_stats)
            # print(f'self.self._concepts2 = {self.self._concepts2}')
            self.create_trait('_concepts2', t.List(t.Dict()), self._concepts2)
            # print(f'self._race_stats2 = {self._race_stats2}')
            self.create_trait('_race_stats2', t.List(t.Dict()), self._race_stats2)
            # print(f'self._ethnicity_stats2 = {self._ethnicity_stats2}')
            self.create_trait('_ethnicity_stats2', t.List(t.Dict()), self._ethnicity_stats2)
            # print(f'self._gender_dist2 = {self._gender_dist2}')
            self.create_trait('_gender_dist2', t.List(t.Dict()), self._gender_dist2)
            # print(f'self._age_dist2 = {self._age_dist2}')
            self.create_trait('_age_dist2', t.List(t.Dict()), self._age_dist2)
            self.create_trait('_cohort2_shortname', t.Unicode(), self._cohort2_shortname)

        # print("initialization completed")
