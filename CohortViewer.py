from statistics import median

import anywidget
import traitlets as t
import pathlib
# import json # uncomment this for saving json to file
from datetime import datetime, date
from decimal import Decimal
import numpy as np
from statistics import mode
# from biasanalyzer.background.threading_utils import run_in_background

class CohortViewer(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "index.js"
    _css = pathlib.Path(__file__).parent / "index.css"
    initialized = t.Bool(default_value=False).tag(sync=True)

    # List of developer-only keys
    _devKeys = [
        'cohort1Metadata', 'cohort1Stats', 'raceStats1', 'ethnicityStats1', 'genderDist1', 'ageDist1', 'condHier1',
        'cohort2Metadata', 'cohort2Stats', 'raceStats2', 'ethnicityStats2', 'genderDist2', 'ageDist2', 'condHier'
    ]

    def is_empty(self, obj):
        # None, empty containers, False, 0, "" all evaluate to False
        if obj is None:
            return True

        # Try len() for containers
        try:
            return len(obj) == 0
        except TypeError:
            # Not a container - check if it's falsy
            return not bool(obj)

    # def saveToFiles(self):
    #     # assumption is that if we have the meta, we have everything else too
    #     if not self.is_empty(self._cohort1Metadata):
        #     with open('./data/cohort_creation_config_study1_example3_cohort1_meta.json', 'w') as f:
        #         json.dump(self._cohort1Metadata, f, indent=2)
        #     with open('./data/cohort_creation_config_study1_example3_cohort1_stats.json', 'w') as f:
        #         json.dump(self._cohort1Stats, f, indent=2)
        #     with open('./data/cohort_creation_config_study1_example3_cohort1_race_stats.json', 'w') as f:
        #         json.dump(self._raceStats1, f, indent=2)
        #     with open('./data/cohort_creation_config_study1_example3_cohort1_ethnicity_stats.json', 'w') as f:
        #         json.dump(self._ethnicityStats1, f, indent=2)
        #     with open('./data/cohort_creation_config_study1_example3_cohort1_gender_dist.json', 'w') as f:
        #         json.dump(self._genderDist1, f, indent=2)
        #     with open('./data/cohort_creation_config_study1_example3_cohort1_age_dist.json', 'w') as f:
        #         json.dump(self._ageDist1, f, indent=2)

            # save single cohort files (whole and interesting) if both cohorts exist
            # with open('./data/cohort_creation_config_study1_example3_cohort1_cond_hier.json', 'w') as f:
            #     json.dump(self.make_json_serializable(self._condHier1.to_dict()), f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_cohort1_interesting_conditions.json', 'w') as f:
            #     json.dump(self.make_json_serializable(self._interestingConditions), f, indent=2)

            # with open('./data/cohort_creation_config_study1_example3_cohort2_cond_hier.json', 'w') as f:
            #     json.dump(self.make_json_serializable(self._condHier1.to_dict()), f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_cohort2_interesting_conditions.json', 'w') as f:
            #     json.dump(self.make_json_serializable(self._interestingConditions), f, indent=2)

        # assumption is that if we have the meta, we have everything else too
        # if not self.is_empty(self._cohort2Metadata):
            # with open('./data/cohort_creation_config_study1_example3_cohort2_meta.json', 'w') as f:
            #     json.dump(self._cohort2Metadata, f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_cohort2_stats.json', 'w') as f:
            #     json.dump(self._cohort2Stats, f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_cohort2_race_stats.json', 'w') as f:
            #     json.dump(self._raceStats2, f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_cohort2_ethnicity_stats.json', 'w') as f:
            #     json.dump(self._ethnicityStats2, f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_cohort2_gender_dist.json', 'w') as f:
            #     json.dump(self._genderDist2, f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_cohort2_age_dist.json', 'w') as f:
            #     json.dump(self._ageDist2, f, indent=2)

            # save union files (whole and interesting) if both cohorts exist
            # with open('./data/cohort_creation_config_study1_example3_union_cond_hier.json', 'w') as f:
            #     json.dump(self.make_json_serializable(self._conditionsHierarchy.get_root_nodes()[0].to_dict()), f, indent=2)
            # with open('./data/cohort_creation_config_study1_example3_union_interesting_conditions.json', 'w') as f:
            #     json.dump(self.make_json_serializable(self._interestingConditions), f, indent=2)

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
        # self.isJsonMode = any(k in kwargs and kwargs[k] is not None for k in CohortViewer._devKeys)

        # Require cohort1 if no developer data
        # if not self.isJsonMode and cohort1 is None:
        #     raise ValueError(
        #         "Cohorts cannot be empty. At least one cohort is needed."
        #     )

        super().__init__()

        # READ PARAMETERS

        # end-user parameters
        self._bias = bias  # NOTE: bias does not need to go to javascript, so no traitlet needed
        self._cohort1 = cohort1
        self._cohort2 = cohort2
        self._cohort1Shortname = cohort1_shortname
        self._cohort2Shortname = cohort2_shortname

        # # developer parameters
        # self._cohort1Metadata = kwargs.get('cohort1Metadata')
        # self._cohort1Stats = kwargs.get('cohort1Stats')
        # # self._condHier1 = kwargs.get('cond_hier1')
        # self._raceStats1 = kwargs.get('raceStats1')
        # self._ethnicityStats1 = kwargs.get('ethnicityStats1')
        # self._genderDist1 = kwargs.get('genderDist1')
        # self._ageDist1 = kwargs.get('ageDist1')
        #
        # self._cohort2Metadata = kwargs.get('cohort2Metadata')
        # self._cohort2Stats = kwargs.get('cohort2Stats')
        # # self._condHier2 = kwargs.get('cond_hier2')
        # self._raceStats2 = kwargs.get('raceStats2')
        # self._ethnicityStats2 = kwargs.get('ethnicityStats2')
        # self._genderDist2 = kwargs.get('genderDist2')
        # self._ageDist2 = kwargs.get('ageDist2')
        #
        # self._conditionsHierarchy = kwargs.get('condHier')

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
    def get_concepts_filter_count(value1, value2):
        return round(min(value1, value2) * 0.5)

    @staticmethod
    def get_unique_nodes(nodes):
        unique_ids = set()
        keep_nodes = []

        def add_node_if_unique(node_list):
            for node in node_list:
                if node.code not in unique_ids:
                    unique_ids.add(node.code)
                    keep_nodes.append(node.to_dict())
        add_node_if_unique(nodes)
        return keep_nodes

    # # compares 2 cohorts and returns a list of "interesting" concept nodes that should be given to javascript
    # def find_interesting_cohort_conditions(self, cohort_id):
    #
    #     def is_unique_node(new_node):
    #         if new_node.code not in seen_ids:
    #             seen_ids.add(new_node.code)
    #             return True
    #         return False
    #
    #     def add_keep_node(node, depth):
    #         if is_unique_node(node):
    #             seen_ids.add(node.code)
    #             new_node = (node.to_dict())
    #             new_node['depth'] = depth
    #             keep_nodes.append(new_node)
    #
    #     # TODO: Change this so that we can recurse even if there is not a significant difference,
    #     #       so that we can scent/hint at lower significances
    #     def recurse(node, cohort_nobs, depth):
    #
    #         children = node.children
    #
    #         # if there are 1 or zero children, keep the parent
    #         if len(children) <= 1:
    #             add_keep_node(node, depth)  # keep the parent
    #             return
    #
    #         # get the differences for all the children
    #         children_prevs = []
    #         # get prevalence for each child
    #         for child in node.children:
    #             print(f'child type = {type(child)}')
    #             print(f'child metrics = {child.get_metrics(cohort_id)}')
    #             # return
    #             # TODO: if there are multiple cohorts, but we are only interested in one,
    #             #       we need to pass the id of the cohort of interest
    #             children_prevs.append(child.get_metrics(self.this_widget_cohort1_id)['prevalence'])
    #
    #         # need at least 2 values for meaningful variance
    #         if len(children_prevs) < 2:
    #             add_keep_node(node, depth)
    #             return
    #
    #         # get the variance in differences across child nodes
    #         var =  np.var(children_prevs)
    #         vars.append(var)
    #
    #         # if low variance, keep the parent
    #         threshold = 2e-5
    #         if var <= threshold:
    #             add_keep_node(node, depth)  # keep the parent
    #             return
    #
    #         for child in children:
    #             recurse(child, cohort_nobs, depth + 1)
    #
    #     seen_ids = set()
    #     keep_nodes = []
    #     # keep a list of the variances for debugging,
    #     # and so that we can have a user-adjustable scale in a future iteration
    #     vars = []
    #
    #     # entry point for recursion
    #     recurse(self._conditionsHierarchy.get_root_nodes()[0], self._cohort1Stats[0]['total_count'],0)
    #
    #     # info for knowing what to set the threshold to
    #     print(f'vars count = {len(vars)}')
    #     non_zero_vars = [x for x in vars if x != 0]
    #     print(f'non_zero_vars count = {len(non_zero_vars)}')
    #     if len(vars) > 0:
    #         print(f'var range = {min(vars)} to {max(vars)}')
    #     else:
    #         print('No variances calculated')
    #     if len(non_zero_vars) > 0:
    #         print(f'median non_zero_vars = {np.median(non_zero_vars)}')
    #         print(f'mean non_zero_vars = {np.mean(non_zero_vars)}')
    #         print(f'mode non_zero_vars = {mode(non_zero_vars)}')
    #     else:
    #         print('All variances are zero')
    #     print(f'keep_nodes count = {len(keep_nodes)}')
    #
    #     return keep_nodes

    # compares 2 cohorts and returns a list of "interesting" concept nodes that should be given to javascript
    def find_interesting_conditions(self, cohort_id_1, cohort_id_2 = 0):

        def is_unique_node(new_node):
            if new_node.code not in seen_ids:
                seen_ids.add(new_node.code)
                return True
            return False

        def add_keep_node(node, depth):
            if is_unique_node(node):
                seen_ids.add(node.code)
                new_node = (node.to_dict())
                new_node['depth'] = depth
                keep_nodes.append(new_node)

        def get_node_diff(node):
            c1 = node.get_metrics(cohort_id_1)
            c2 = node.get_metrics(cohort_id_2)
            # if a cohort doesn't exist for this node, then set it to zero
            if not c1 or 'prevalence' not in c1:
                c1['prevalence'] = 0
            if not c2 or 'prevalence' not in c2:
                c2['prevalence'] = 0
            return abs(c1['prevalence'] - c2['prevalence'])

        # TODO: Change this so that we can recurse even if there is not a significant difference,
        #       so that we can scent/hint at lower significances
        def recurse(node, depth, cohort1_nobs, cohort2_nobs = 0):

            children = node.children

            # if there are 1 or zero children, keep the parent
            if len(children) <= 1:
                add_keep_node(node, depth)  # keep the parent
                return

            if cohort_id_2 > 0:
                # get the differences for all the children
                children_diffs = []
                # get diff between 2 cohorts of interest for each child
                for child in node.children:
                    children_diffs.append(get_node_diff(child))
                # need at least 2 values for meaningful variance
                if len(children_diffs) < 2:
                    add_keep_node(node, depth)
                    return
                # get the variance in differences across child nodes
                var =  np.var(children_diffs)
            else:
                # get the differences for all the children
                children_prevs = []
                # get prevalence for each child
                for child in node.children:
                    # print(f'child type = {type(child)}')
                    # return
                    children_prevs.append(child.get_metrics(self.this_widget_cohort1_id)['prevalence'])
                # need at least 2 values for meaningful variance
                if len(children_prevs) < 2:
                    add_keep_node(node, depth)
                    return
                # get the variance in differences across child nodes
                var =  np.var(children_prevs)

            vars.append(var)

            # if low variance, keep the parent
            threshold = 2e-5
            if var <= threshold:
                add_keep_node(node, depth)  # keep the parent
                return

            for child in children:
                recurse(child, depth + 1, cohort1_nobs, cohort2_nobs)

        seen_ids = set()
        keep_nodes = []
        # keep a list of the variances for debugging,
        # and so that we can have a user-adjustable scale in a future iteration
        vars = []

        # entry point for recursion
        if cohort_id_2 > 0:
            recurse(self._conditionsHierarchy.get_root_nodes()[0], 0, self._cohort1Stats[0]['total_count'],
                    self._cohort2Stats[0]['total_count'])
        else:
            recurse(self._conditionsHierarchy.get_root_nodes()[0], 0, self._cohort1Stats[0]['total_count'])

        # info for knowing what to set the threshold to
        # print(f'vars count = {len(vars)}')
        # non_zero_vars = [x for x in vars if x != 0]
        # print(f'non_zero_vars count = {len(non_zero_vars)}')
        # if len(vars) > 0:
        #     print(f'var range = {min(vars)} to {max(vars)}')
        # else:
        #     print('No variances calculated')
        # if len(non_zero_vars) > 0:
        #     print(f'median non_zero_vars = {np.median(non_zero_vars)}')
        #     print(f'mean non_zero_vars = {np.mean(non_zero_vars)}')
        #     print(f'mode non_zero_vars = {mode(non_zero_vars)}')
        # else:
        #     print('All variances are zero')
        # print(f'keep_nodes count = {len(keep_nodes)}')

        return keep_nodes

    def init_widget(self):
        # if we are not injecting json, get the datasets
        # we are also serializing so that object fields (e.g., dates) can be passed to javascript
        # if not self.isJsonMode:
        self._cohort1Metadata = self.make_json_serializable(self._cohort1.metadata)
        self._cohort1Stats = self.make_json_serializable(self._cohort1.get_stats())
        self._raceStats1 = self.make_json_serializable(self._cohort1.get_stats('race'))
        self._ethnicityStats1 = self.make_json_serializable(self._cohort1.get_stats('ethnicity'))
        self._genderDist1 = self.make_json_serializable(self._cohort1.get_distributions('gender'))
        self._ageDist1 = self.make_json_serializable(self._cohort1.get_distributions('age'))
        cond1, cond_hier1 = self._cohort1.get_concept_stats()
        self._conditionsHierarchy = cond_hier1
        # print(f'self._conditionsHierarchy for cohort1 type = {type(self._conditionsHierarchy)}')

        if self._cohort2 is not None:
            self._cohort2Metadata = self.make_json_serializable(self._cohort2.metadata)
            self._cohort2Stats = self.make_json_serializable(self._cohort2.get_stats())
            self._raceStats2 = self.make_json_serializable(self._cohort2.get_stats('race'))
            self._ethnicityStats2 = self.make_json_serializable(self._cohort2.get_stats('ethnicity'))
            self._genderDist2 = self.make_json_serializable(self._cohort2.get_distributions('gender'))
            self._ageDist2 = self.make_json_serializable(self._cohort2.get_distributions('age'))
            cond2, cond_hier2 = self._cohort2.get_concept_stats()
            self._conditionsHierarchy = self._conditionsHierarchy.union(cond_hier2)
            # print(f'self._conditionsHierarchy union type = {type(self._conditionsHierarchy)}')
        else:
            self._cohort2Metadata = None
            self._cohort2Stats = None
            self._raceStats2 = None
            self._ethnicityStats2 = None
            self._genderDist2 = None
            self._ageDist2 = None
        # #     else:
        #         self._conditionsHierarchy = self._condHier1

            # print(f'self._conditionsHierarchy = {self._conditionsHierarchy}')
            # root = self._conditionsHierarchy.get_root_nodes(serialization=True)[0]["node_metrics"][1]['probability']
            # print(f'root = {root}')

        # Give data to traitlets, mostly as lists of dictionaries

        # print(f'self._cohort1Metadata = {self._cohort1Metadata}')
        self.create_trait('_cohort1Metadata', t.Dict(), self._cohort1Metadata)
        # print(f'self._cohort1Stats = {self._cohort1Stats}')
        self.create_trait('_cohort1Stats', t.List(t.Dict()), self._cohort1Stats)
        # print(f'self._raceStats1 = {self._raceStats1}')
        self.create_trait('_raceStats1', t.List(t.Dict()), self._raceStats1)
        # print(f'self._ethnicityStats1 = {self._ethnicityStats1}')
        self.create_trait('_ethnicityStats1', t.List(t.Dict()), self._ethnicityStats1)
        # print(f'self._genderDist1 = {self._genderDist1}')
        self.create_trait('_genderDist1', t.List(t.Dict()), self._genderDist1)
        # print(f'self._ageDist1 = {self._ageDist1}')
        self.create_trait('_ageDist1', t.List(t.Dict()), self._ageDist1)
        self.create_trait('_cohort1Shortname', t.Unicode(), self._cohort1Shortname)

        # assumption is that if we have the meta, we have everything else too
        if not self.is_empty(self._cohort2Metadata):
            # print(f'self._cohort2Metadata = {self._cohort2Metadata}')
            self.create_trait('_cohort2Metadata', t.Dict(), self._cohort2Metadata)
            # print(f'self._cohort2Stats = {self._cohort2Stats}')
            self.create_trait('_cohort2Stats', t.List(t.Dict()), self._cohort2Stats)
            # print(f'self._raceStats2 = {self._raceStats2}')
            self.create_trait('_raceStats2', t.List(t.Dict()), self._raceStats2)
            # print(f'self._ethnicityStats2 = {self._ethnicityStats2}')
            self.create_trait('_ethnicityStats2', t.List(t.Dict()), self._ethnicityStats2)
            # print(f'self._genderDist2 = {self._genderDist2}')
            self.create_trait('_genderDist2', t.List(t.Dict()), self._genderDist2)
            # print(f'self._ageDist2 = {self._ageDist2}')
            self.create_trait('_ageDist2', t.List(t.Dict()), self._ageDist2)
            self.create_trait('_cohort2Shortname', t.Unicode(), self._cohort2Shortname)

        # print("getting interesting condition occurrences")
        # if self.isJsonMode:
        #     # if we are loading from json, just use the file that was loaded
        #     # this also means that there is no depth calculation in json mode
        #     interesting_conditions = self._conditionsHierarchy
        # else:
        # print(f"total node count = {count_all_nodes(self._conditionsHierarchy.get_root_nodes()[0].to_dict())}")

        self.this_widget_cohort1_id = self._cohort1.cohort_id
        if not self.is_empty(self._cohort2):
            self.this_widget_cohort2_id = self._cohort2.cohort_id
            # here we are comparing 2 cohorts
            self._interestingConditions = self.find_interesting_conditions(self.this_widget_cohort1_id, self.this_widget_cohort2_id)
        else:
            # here there is just one cohort
            self._interestingConditions = self.find_interesting_conditions(self.this_widget_cohort1_id)

        # print('self._interestingConditions', self._interestingConditions)
        # print(f"interesting_conditions count = {len(self._interestingConditions)}")
        # print(f"interesting_conditions total node count = {count_all_nodes(self._interestingConditions[0])}")

        # save data as json for easier development
        # def on_save_complete(result, error):
        #     if error:
        #         print(f"Error saving files: {error}")
        #     else:
        #         print("All files saved successfully!")
        # thread = run_in_background(self.saveToFiles, on_complete=on_save_complete)
        # self.saveToFiles() # synchronous save files

        # self._interesting conditions is a list of dictionaries to pass to javascript
        # this means that self._conditionsHierarchy can stay as a list of nodes
        self.create_trait('_interestingConditions', t.List(t.Dict()),  self._interestingConditions)

        # print("initialization completed")
