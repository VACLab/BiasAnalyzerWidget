import anywidget
import traitlets as t
import pathlib
import json
from datetime import datetime, date
from decimal import Decimal

class ViewCohorts(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "index.js"
    _css = pathlib.Path(__file__).parent / "index.css"
    initialized = t.Bool(default_value=False).tag(sync=True)

    # List of developer-only keys
    _dev_keys = [
        'cohort1_meta', 'cohort1_stats', 'race_stats1', 'ethnicity_stats1', 'gender_dist1', 'age_dist1', 'cond_hier1',
        'cohort2_meta', 'cohort2_stats', 'race_stats2', 'ethnicity_stats2', 'gender_dist2', 'age_dist2', 'cond_hier2'
    ]

    @staticmethod
    def is_empty(obj):
        return True if obj is None or len(obj) == 0 else False

    def saveToFiles(self):
        # assumption is that if we have the meta, we have everything else too
        if not self.is_empty(self._cohort1_meta):
            with open('./data/cohort_creation_config_study1_example3_cohort1_meta.json', 'w') as f:
                json.dump(self._cohort1_meta, f, indent=4)
            with open('./data/cohort_creation_config_study1_example3_cohort1_stats.json', 'w') as f:
                json.dump(self._cohort1_stats, f, indent=4)
            with open('./data/cohort_creation_config_study1_example3_cond_hier1.json', 'w') as f:
                json.dump(self.make_json_serializable(self._cond_hier1.to_dict()), f, indent=4)
            with open('./data/cohort_creation_config_study1_example3_cohort1_race_stats.json', 'w') as f:
                json.dump(self._race_stats1, f, indent=4)
            with open('./data/cohort_creation_config_study1_example3_ethnicity_stats1.json', 'w') as f:
                json.dump(self._ethnicity_stats1, f, indent=4)
            with open('./data/cohort_creation_config_study1_example3_cohort1_gender_dist1.json', 'w') as f:
                json.dump(self._gender_dist1, f, indent=4)
            with open('./data/cohort_creation_config_study1_example3_age_dist1.json', 'w') as f:
                json.dump(self._age_dist1, f, indent=4)

        # assumption is that if we have the meta, we have everything else too
        if not self.is_empty(self._cohort2_meta):
            with open('./data/cohort_creation_config_study1_example3_cohort2_meta.json', 'w') as f:
                json.dump(self._cohort2_meta, f, indent=4)
            with open('./data/cohort_creation_config_study1_example3_cohort2_stats.json', 'w') as f:
                json.dump(self._cohort2_stats, f, indent=4)
            with open('./data/cohort_creation_config_study1_example3_cond_hier2.json', 'w') as f:
                json.dump(self.make_json_serializable(self._cond_hier2.to_dict()), f, indent=4)
            with open('./data/cohort_creation_config_study1_example3_cohort2_race_stats.json', 'w') as f:
                json.dump(self._race_stats2, f, indent=4)
            with open('./data/cohort_creation_config_study1_example3_ethnicity_stats2.json', 'w') as f:
                json.dump(self._ethnicity_stats2, f, indent=4)
            with open('./data/cohort_creation_config_study1_example3_cohort2_gender_dist2.json', 'w') as f:
                json.dump(self._gender_dist2, f, indent=4)
            with open('./data/cohort_creation_config_study1_example3_age_dist2.json', 'w') as f:
                json.dump(self._age_dist2, f, indent=4)

            print('finished saving data to files')

    # Convert non-JSON-serializable objects to JSON-compatible types
    def make_json_serializable(self, obj):
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
            bias=None,
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

        # READ PARAMETERS

        # end-user parameters
        self._bias = bias  # NOTE: bias does not need to go to javascript, so no traitlet needed
        self._cohort1 = cohort1
        self._cohort2 = cohort2
        self._cohort1_shortname = cohort1_shortname
        self._cohort2_shortname = cohort2_shortname

        # developer parameters
        self._cohort1_meta = kwargs.get('cohort1_metadata')
        self._cohort1_stats = kwargs.get('cohort1_stats')
        self._cond_hier1 = kwargs.get('cond_hier1')
        self._race_stats1 = kwargs.get('race_stats1')
        self._ethnicity_stats1 = kwargs.get('ethnicity_stats1')
        self._gender_dist1 = kwargs.get('gender_dist1')
        self._age_dist1 = kwargs.get('age_dist1')

        self._cohort2_meta = kwargs.get('cohort2_metadata')
        self._cohort2_stats = kwargs.get('cohort2_stats')
        self._cond_hier2 = kwargs.get('cond_hier2')
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

    @staticmethod
    def getConceptsFilterCount(value1, value2):
        return round(min(value1, value2) * 0.5)

    # TODO: This is where to go through the conditions and isolate interesting concept
    # def findInterestingConditions(self, node, depth):
    #
    #     # Recursively traverse tree and find nodes where the difference
    #     # between value1 and value2 exceeds the threshold.
    #     # Parameters:
    #     #     node: Current TreeNode being visited
    #     #     threshold: Minimum difference to match (default 0.3)
    #     #     matching_nodes: List to collect matching nodes
    #     # Returns:
    #     #     List of nodes that meet the criteria
    #     def find_nodes_with_large_difference(node, threshold=0.3, matching_nodes=None, depth=0):
    #         # print(f"Depth: {depth}; Node: {node.value}")
    #
    #
    #         print(f'type of node.cond_hier = {type(node.cond_hie)}')
    #         print(f'type of node.cond_hier name = {type(self._cond_occurs).__name__}')
    #         print(f'type of node.cond_hier class = {type(self._cond_occurs).__class__}')
    #         print(f'type of node.cond_hier class name = {type(self._cond_occurs).__class__.__name__}')
    #
    #         if matching_nodes is None:
    #             matching_nodes = []
    #
    #         # Check if current node meets the criteria
    #         diff = node.get_difference()
    #         if diff > threshold:
    #             matching_nodes.append(node)
    #
    #         # Recursively check all children
    #         for child in node.children:
    #             find_nodes_with_large_difference(child, threshold, matching_nodes)
    #
    #         return matching_nodes
    #
    #     if self.is_empty(self._cohort2):
    #         # TODO: Test this and see what it looks like, then adjust as needed.
    #         #       We should also remove any where prevalence is 1 or 0 in both cohorts
    #         interesting_conditions = self._cond_hier.get_leaf_nodes(self._cond_hier)
    #     else:
    #         # Print current node with indentation based on depth
    #         interesting_conditions = find_nodes_with_large_difference(node, 0.3)
    #     return interesting_conditions

    def init_widget(self):
        # if we are not injecting json, get the datasets
        # we are also serializing so that object fields (e.g., dates) can be passed to javascript
        if not self.is_json_mode:
            self._cohort1_meta = self.make_json_serializable(self._cohort1.metadata)
            self._cohort1_stats = self.make_json_serializable(self._cohort1.get_stats())
            self._race_stats1 = self.make_json_serializable(self._cohort1.get_stats('race'))
            self._ethnicity_stats1 = self.make_json_serializable(self._cohort1.get_stats('ethnicity'))
            self._gender_dist1 = self.make_json_serializable(self._cohort1.get_distributions('gender'))
            self._age_dist1 = self.make_json_serializable(self._cohort1.get_distributions('age'))
            conds1, self._cond_hier1 = self._cohort1.get_concept_stats()

            if self._cohort2 is not None:
                self._cohort2_meta = self.make_json_serializable(self._cohort2.metadata)
                self._cohort2_stats = self.make_json_serializable(self._cohort2.get_stats())
                self._race_stats2 = self.make_json_serializable(self._cohort2.get_stats('race'))
                self._ethnicity_stats2 = self.make_json_serializable(self._cohort2.get_stats('ethnicity'))
                self._gender_dist2 = self.make_json_serializable(self._cohort2.get_distributions('gender'))
                self._age_dist2 = self.make_json_serializable(self._cohort2.get_distributions('age'))
                conds2, self._cond_hier2 = self._cohort2.get_concept_stats()

                self._cond_hier = self._cond_hier1.union(self._cond_hier2)
            else:
                self._cond_hier = self._cond_hier1

            print(f'self._cond_hier = {self._cond_hier}')
            root = self._cond_hier.get_root_nodes(serialization=True)[0]["metrics"][1]['probability']
            print(f'root = {root}')


        # self.saveToFiles()

        # Give data to traitlets, mostly as lists of dictionaries -- exceptions are metadata & shortname

        # print(f'self._cohort1_meta = {self._cohort1_meta}')
        self.create_trait('_cohort1_meta', t.Dict(), self._cohort1_meta)
        # print(f'self._cohort1_stats = {self._cohort1_stats}')
        self.create_trait('_cohort1_stats', t.List(t.Dict()), self._cohort1_stats)
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
            # print(f'self._race_stats2 = {self._race_stats2}')
            self.create_trait('_race_stats2', t.List(t.Dict()), self._race_stats2)
            # print(f'self._ethnicity_stats2 = {self._ethnicity_stats2}')
            self.create_trait('_ethnicity_stats2', t.List(t.Dict()), self._ethnicity_stats2)
            # print(f'self._gender_dist2 = {self._gender_dist2}')
            self.create_trait('_gender_dist2', t.List(t.Dict()), self._gender_dist2)
            # print(f'self._age_dist2 = {self._age_dist2}')
            self.create_trait('_age_dist2', t.List(t.Dict()), self._age_dist2)
            self.create_trait('_cohort2_shortname', t.Unicode(), self._cohort2_shortname)

        # print(f'type of self._conditions = {type(self._cond_occurs)}')
        # print(f'type of self._conditions name = {type(self._cond_occurs).__name__}')
        # print(f'type of self._conditions class = {type(self._cond_occurs).__class__}')
        # print(f'type of self._conditions class name = {type(self._cond_occurs).__class__.__name__}')
        #
        # # print(f'self._cond_occurs = {self._cond_occurs}')
        #
        # # Assumption that there is only one root node
        # self.create_trait('_cond_hier', t.List(t.Dict()),
        #                   self.make_json_serializable(self.findInterestingConditions(self._cond_hier.get_root_nodes(), 0)))

        # print("initialization completed")
