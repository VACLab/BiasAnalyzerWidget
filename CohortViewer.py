import anywidget
import traitlets as t
import pathlib
# import json # uncomment this for saving json to file
from datetime import datetime, date
from decimal import Decimal
from statsmodels.stats.proportion import proportions_ztest # Two-sided test (default)
import numpy as np
# from biasanalyzer.background.threading_utils import run_in_background

class CohortViewer(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "index.js"
    _css = pathlib.Path(__file__).parent / "index.css"
    initialized = t.Bool(default_value=False).tag(sync=True)

    # List of developer-only keys
    _dev_keys = [
        'cohort1_meta', 'cohort1_stats', 'race_stats1', 'ethnicity_stats1', 'gender_dist1', 'age_dist1', 'cond_hier1',
        'cohort2_meta', 'cohort2_stats', 'race_stats2', 'ethnicity_stats2', 'gender_dist2', 'age_dist2', 'cond_hier'
    ]

    @staticmethod
    def is_empty(obj):
        return True if obj is None or len(obj) == 0 else False

    # def saveToFiles(self):
    #     # assumption is that if we have the meta, we have everything else too
    #     if not self.is_empty(self._cohort1_meta):
        #     with open('./data/cohort_creation_config_study1_example3_cohort1_meta.json', 'w') as f:
        #         json.dump(self._cohort1_meta, f, indent=2)
        #     with open('./data/cohort_creation_config_study1_example3_cohort1_stats.json', 'w') as f:
        #         json.dump(self._cohort1_stats, f, indent=2)
        #     with open('./data/cohort_creation_config_study1_example3_cohort1_race_stats.json', 'w') as f:
        #         json.dump(self._race_stats1, f, indent=2)
        #     with open('./data/cohort_creation_config_study1_example3_cohort1_ethnicity_stats.json', 'w') as f:
        #         json.dump(self._ethnicity_stats1, f, indent=2)
        #     with open('./data/cohort_creation_config_study1_example3_cohort1_gender_dist.json', 'w') as f:
        #         json.dump(self._gender_dist1, f, indent=2)
        #     with open('./data/cohort_creation_config_study1_example3_cohort1_age_dist.json', 'w') as f:
        #         json.dump(self._age_dist1, f, indent=2)

            # save single cohort files (whole and interesting) if both cohorts exist
            # with open('./data/cohort_creation_config_study1_example3_cohort1_cond_hier.json', 'w') as f:
            #     json.dump(self.make_json_serializable(self._cond_hier1.to_dict()), f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_cohort1_interesting_conditions.json', 'w') as f:
            #     json.dump(self.make_json_serializable(self._interesting_conditions), f, indent=2)

            # with open('./data/cohort_creation_config_study1_example3_cohort2_cond_hier.json', 'w') as f:
            #     json.dump(self.make_json_serializable(self._cond_hier1.to_dict()), f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_cohort2_interesting_conditions.json', 'w') as f:
            #     json.dump(self.make_json_serializable(self._interesting_conditions), f, indent=2)

        # assumption is that if we have the meta, we have everything else too
        # if not self.is_empty(self._cohort2_meta):
            # with open('./data/cohort_creation_config_study1_example3_cohort2_meta.json', 'w') as f:
            #     json.dump(self._cohort2_meta, f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_cohort2_stats.json', 'w') as f:
            #     json.dump(self._cohort2_stats, f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_cohort2_race_stats.json', 'w') as f:
            #     json.dump(self._race_stats2, f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_cohort2_ethnicity_stats.json', 'w') as f:
            #     json.dump(self._ethnicity_stats2, f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_cohort2_gender_dist.json', 'w') as f:
            #     json.dump(self._gender_dist2, f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_cohort2_age_dist.json', 'w') as f:
            #     json.dump(self._age_dist2, f, indent=2)

            # save union files (whole and interesting) if both cohorts exist
            # with open('./data/cohort_creation_config_study1_example3_union_cond_hier.json', 'w') as f:
            #     json.dump(self.make_json_serializable(self._cond_hier.get_root_nodes()[0].to_dict()), f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_union_interesting_conditions.json', 'w') as f:
            #     json.dump(self.make_json_serializable(self._interesting_conditions), f, indent=2)

            # print('finished saving data to files')

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
            cohort1_shortname='study',
            cohort2_shortname='baseline',
            **kwargs
    ):
        # Determine if developer kwargs were passed
        self.is_json_mode = any(k in kwargs and kwargs[k] is not None for k in CohortViewer._dev_keys)

        # Require cohort1 if no developer data
        if not self.is_json_mode and cohort1 is None:
            raise ValueError(
                "Cohorts cannot be empty. At least one cohort is needed."
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
        # self._cond_hier1 = kwargs.get('cond_hier1')
        self._race_stats1 = kwargs.get('race_stats1')
        self._ethnicity_stats1 = kwargs.get('ethnicity_stats1')
        self._gender_dist1 = kwargs.get('gender_dist1')
        self._age_dist1 = kwargs.get('age_dist1')

        self._cohort2_meta = kwargs.get('cohort2_metadata')
        self._cohort2_stats = kwargs.get('cohort2_stats')
        # self._cond_hier2 = kwargs.get('cond_hier2')
        self._race_stats2 = kwargs.get('race_stats2')
        self._ethnicity_stats2 = kwargs.get('ethnicity_stats2')
        self._gender_dist2 = kwargs.get('gender_dist2')
        self._age_dist2 = kwargs.get('age_dist2')

        self._cond_hier = kwargs.get('cond_hier')

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

            # print(f'self._cond_hier = {self._cond_hier}')
            # root = self._cond_hier.get_root_nodes(serialization=True)[0]["node_metrics"][1]['probability']
            # print(f'root = {root}')

        # Give data to traitlets, mostly as lists of dictionaries

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

        def getUniqueNodes(nodes):
            unique_ids = set()
            keep_nodes = []

            def addNodeIfUnique(nodes):
                for node in nodes:
                    if node.code not in unique_ids:
                        unique_ids.add(node.code)
                        keep_nodes.append(node.to_dict())
            addNodeIfUnique(nodes)
            return keep_nodes

        def findInterestingCompareConditions(node, total_count, depth):
            unique_ids = set()
            keep_nodes = []

            def isUniqueNode(new_node):
                if new_node.code not in unique_ids:
                    unique_ids.add(new_node.code)
                    return True
                return False

            def isSignificantDiff(prop1, prop2, n1, n2, level=0.05):
                # print(f"prop1, prop2, n1, n2 = {prop1, prop2, n1, n2}")

                # Check for invalid inputs
                if n1 == 0 or n2 == 0 or prop1 == prop2:
                    return False

                # Calculate counts
                count1 = int(prop1 * n1)
                count2 = int(prop2 * n2)

                # Check if pooled proportion would be 0 or 1 (causes zero variance)
                pooled_count = count1 + count2
                pooled_n = n1 + n2
                pooled_prop = pooled_count / pooled_n

                if pooled_prop == 0 or pooled_prop == 1:
                    return False

                # Perform test with error handling
                counts = np.array([count1, count2])
                nobs = np.array([n1, n2])

                try:
                    z_stat, p_value = proportions_ztest(counts, nobs)
                    return p_value < level
                except:
                    return False

            def recurse(node, total_count, depth):
                node_metrics = node.get_union_metrics()
                # print(f'depth = {depth}; node_metrics = {node_metrics}')

                children = node.children
                for child in children:
                    child_metrics = child.get_union_metrics()
                    if child_metrics['count'] < total_count * 0.1:
                        continue
                    if child_metrics['prevalence'] == 1 or child_metrics['prevalence'] == 0:
                        continue

                    # print(f'depth = {depth}; child_metrics = {child_metrics}')
                    # keep the parent node if we are not recursing
                    # TODO: Can the inclusion/exclusion criteria be improved?
                    #       Look at what is done in dynamic reweighting -- is it plausible here?
                    # TODO: Change this so that we can recurse even if there is not a significant difference,
                    #       so that we can scent/hint at lower significances
                    if isSignificantDiff(child_metrics['prevalence'], node_metrics['prevalence'],
                                         total_count, total_count):
                        recurse(child, total_count, depth + 1)
                    else:
                        # uncomment these lines to load all nodes
                        # child_dict = child.to_dict()
                        # keep_nodes.append(child_dict)
                        if isUniqueNode(child):
                            keep_nodes.append(child.to_dict())
                        # addNodeIfUnique(child)

            recurse(node, total_count, depth)
            # print(f'keep_nodes = {keep_nodes}')
            return keep_nodes

        def count_nodes(node):
            """Count nodes in a single tree"""
            count = 1  # count this node

            # Get children based on node type
            if isinstance(node, dict):
                children = node.get('children', [])
            else:
                children = getattr(node, 'children', [])

            # Recursively count children
            for child in children:
                count += count_nodes(child)

            return count

        def count_all_nodes(trees):
            """Count nodes in either a single tree or list of trees"""
            # Handle single tree vs list of trees
            if isinstance(trees, (dict, object)) and not isinstance(trees, list):
                # It's a single tree
                return count_nodes(trees)

            # It's a list of trees
            return sum(count_nodes(tree) for tree in trees)

        # print(f"full node count = {count_all_nodes(self._cond_hier.get_root_nodes())}")
        total_patients = self._cohort1_stats[0]['total_count']
        if self._cohort2 is not None:
            total_patients += self._cohort2_stats[0]['total_count']

        # print("getting interesting condition occurrences")
        if self.is_json_mode:
            # if we are loading from json, just use the file that was loaded
            self._interesting_conditions = self._cond_hier
        else:
            # print(f"total node count = {count_all_nodes(self._cond_hier.get_root_nodes()[0].to_dict())}")
            if not self.is_empty(self._cohort2_meta):
                # if we are comparing 2 cohorts
                self._interesting_conditions = findInterestingCompareConditions(self._cond_hier.get_root_nodes()[0], total_patients , 0)
            else:
                # if there is just one cohort, use the leaf nodes
                self._interesting_conditions = getUniqueNodes(self._cond_hier.get_leaf_nodes())

        # print('self._interesting_conditions', self._interesting_conditions)
        # print(f"interesting_conditions count = {len(self._interesting_conditions)}")
        # print(f"interesting_conditions total node count = {count_all_nodes(self._interesting_conditions[0])}")

        # print(f"Type: {type(self._interesting_conditions)}")
        # print(f"Value: {self._interesting_conditions}")

        # save data as json for easier development
        # def on_save_complete(result, error):
        #     if error:
        #         print(f"Error saving files: {error}")
        #     else:
        #         print("All files saved successfully!")
        # thread = run_in_background(self.saveToFiles, on_complete=on_save_complete)
        # self.saveToFiles() # synchronous save files
        self.create_trait('_cond_hier', t.List(t.Dict()), self._interesting_conditions)

        # print("initialization completed")
