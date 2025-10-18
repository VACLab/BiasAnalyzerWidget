import anywidget
import traitlets as t
import pathlib
# import json # uncomment this for saving json to file
from datetime import datetime, date
from decimal import Decimal
import itertools
from scipy.stats import norm
import math
# import numpy as np
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

    @staticmethod
    def is_empty(obj):
        return True if obj is None or len(obj) == 0 else False

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
        self.isJsonMode = any(k in kwargs and kwargs[k] is not None for k in CohortViewer._devKeys)

        # Require cohort1 if no developer data
        if not self.isJsonMode and cohort1 is None:
            raise ValueError(
                "Cohorts cannot be empty. At least one cohort is needed."
            )

        super().__init__()

        # READ PARAMETERS

        # end-user parameters
        self._bias = bias  # NOTE: bias does not need to go to javascript, so no traitlet needed
        self._cohort1 = cohort1
        self._cohort2 = cohort2
        self._cohort1Shortname = cohort1_shortname
        self._cohort2Shortname = cohort2_shortname

        # developer parameters
        self._cohort1Metadata = kwargs.get('cohort1Metadata')
        self._cohort1Stats = kwargs.get('cohort1Stats')
        # self._condHier1 = kwargs.get('cond_hier1')
        self._raceStats1 = kwargs.get('raceStats1')
        self._ethnicityStats1 = kwargs.get('ethnicityStats1')
        self._genderDist1 = kwargs.get('genderDist1')
        self._ageDist1 = kwargs.get('ageDist1')

        self._cohort2Metadata = kwargs.get('cohort2Metadata')
        self._cohort2Stats = kwargs.get('cohort2Stats')
        # self._condHier2 = kwargs.get('cond_hier2')
        self._raceStats2 = kwargs.get('raceStats2')
        self._ethnicityStats2 = kwargs.get('ethnicityStats2')
        self._genderDist2 = kwargs.get('genderDist2')
        self._ageDist2 = kwargs.get('ageDist2')

        self._conditionsHierarchy = kwargs.get('condHier')

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

    # compares 2 cohorts and returns a list of "interesting" concept nodes that should be given to javascript
    def find_interesting_compare_conditions(self, cohort_id_1, cohort_id_2):

        def is_unique_node(new_node):
            if new_node.code not in seen_ids:
                seen_ids.add(new_node.code)
                return True
            return False

        # TODO: Change this so that we can recurse even if there is not a significant difference,
        #       so that we can scent/hint at lower significances
        def recurse(node, cohort1_nobs, cohort2_nobs, depth):

            def add_keep_node(a_node):
                if is_unique_node(a_node):
                    seen_ids.add(a_node.code)
                    new_node = (a_node.to_dict())
                    new_node['depth'] = depth
                    keep_nodes.append(new_node)

            def get_node_stats(a_node):
                c1 = a_node.get_metrics(cohort_id_1)
                c2 = a_node.get_metrics(cohort_id_2)

                # ADD THIS CHECK BEFORE ACCESSING THE KEYS
                if not c1 or 'prevalence' not in c1 or not c2 or 'prevalence' not in c2:
                    return None

                var = (c1['prevalence'] * (1 - c1['prevalence']) / cohort1_nobs
                       + c2['prevalence'] * (1 - c2['prevalence']) / cohort2_nobs)
                diff = c1['prevalence'] - c2['prevalence']
                return {"concept_code": a_node.code, "diff": diff, "variance": var, "p_c1": c1['prevalence'], "p_c2": c2['prevalence'],
                        "n1": c1["count"], "n2": c2["count"]}

            def is_significant_diff(stats1, stats2, alpha=0.05, tails=2):
                diff_diff = stats1["diff"] - stats2["diff"]
                # Standard error
                se = math.sqrt(stats1["variance"] + stats2["variance"])
                z = diff_diff / se if se != 0 else float("nan")
                chi2 = z ** 2

                if tails == 2:
                    p_value = 2 * (1 - norm.cdf(abs(z)))  # two-tailed
                elif tails == 1:
                    p_value = 1 - norm.cdf(z)  # one-tailed (right tail)
                else:
                    raise ValueError("tails must be 1 or 2")

                return p_value < alpha  # return significant or not

            children = node.children
            if len(children) == 0:
                add_keep_node(node)
                return

            # get parent stats to compare with the significant children
            parent_stats = get_node_stats(node)
            do_recurse = False
            children_stats = []  # diff, variance for each child node
            alpha = 0.05  # TODO: initialize higher up and pass it in; should be updatable from user input
            signif_children = []  # significant nodes

            # get stats for each child
            for child in node.children:
                stats = get_node_stats(child)
                if stats is not None:  # Only add if we got valid stats
                    children_stats.append(stats)

            # compare each pair of children to get significances
            for c1, c2 in itertools.combinations(children_stats, 2):
                # print(f"c1: {c1}, c2: {c2}")
                significant = is_significant_diff(c1, c2, alpha, 2)

                if significant:
                    signif_children.append(c1)
                    signif_children.append(c2)

            # we now have a list of child nodes that are significantly different from each other
            # now, for each significant node we need to compare variance with parent

            def find_child_stats(stats_list, node):
                for stats in stats_list:
                    # print(f"stats = {stats}")
                    if stats["concept_code"] == node['concept_code']:
                        return stats
                return None

            for child in signif_children:
                # we only need one child to be higher, so if we already have one we can stop looking
                if parent_stats['variance'] < find_child_stats(children_stats, child)['variance']:
                    do_recurse = True
                    break

            if do_recurse:  # recurse down the children
                for child in children:
                    recurse(child, cohort1_nobs, cohort2_nobs, depth + 1)
            else: # or keep the parent
                add_keep_node(node)

        seen_ids = set()
        keep_nodes = []

        # print(f"self._cohort1Stats = {self._cohort1Stats}")
        # print(f"self._cohort2Stats = {self._cohort2Stats}")
        recurse(self._conditionsHierarchy.get_root_nodes()[0], self._cohort1Stats[0]['total_count'],
                self._cohort2Stats[0]['total_count'], 0)
        # print(f'keep_nodes = {keep_nodes}')
        return keep_nodes

        # def count_nodes(node):
        #     """Count nodes in a single tree"""
        #     count = 1  # count this node
        #
        #     # Get children based on node type
        #     if isinstance(node, dict):
        #         children = node.get('children', [])
        #     else:
        #         children = getattr(node, 'children', [])
        #
        #     # Recursively count children
        #     for child in children:
        #         count += count_nodes(child)
        #
        #     return count
        #
        # def count_all_nodes(trees):
        #     """Count nodes in either a single tree or list of trees"""
        #     # Handle single tree vs list of trees
        #     if isinstance(trees, (dict, object)) and not isinstance(trees, list):
        #         # It's a single tree
        #         return count_nodes(trees)
        #
        #     # It's a list of trees
        #     return sum(count_nodes(tree) for tree in trees)

        # interestingConditions = []  # holds a list of interesting conditions

        # print(f"full node count = {count_all_nodes(self._conditionsHierarchy.get_root_nodes())}")

        # totalPatients = self._cohort1Stats[0]['total_count']
        # if self._cohort2 is not None:
        #     totalPatients += self._cohort2Stats[0]['total_count']

        # return interestingConditions

    def init_widget(self):
        # if we are not injecting json, get the datasets
        # we are also serializing so that object fields (e.g., dates) can be passed to javascript
        if not self.isJsonMode:
            self._cohort1Metadata = self.make_json_serializable(self._cohort1.metadata)
            self._cohort1Stats = self.make_json_serializable(self._cohort1.get_stats())
            self._raceStats1 = self.make_json_serializable(self._cohort1.get_stats('race'))
            self._ethnicityStats1 = self.make_json_serializable(self._cohort1.get_stats('ethnicity'))
            self._genderDist1 = self.make_json_serializable(self._cohort1.get_distributions('gender'))
            self._ageDist1 = self.make_json_serializable(self._cohort1.get_distributions('age'))
            conds1, self._condHier1 = self._cohort1.get_concept_stats()

            if self._cohort2 is not None:
                self._cohort2Metadata = self.make_json_serializable(self._cohort2.metadata)
                self._cohort2Stats = self.make_json_serializable(self._cohort2.get_stats())
                self._raceStats2 = self.make_json_serializable(self._cohort2.get_stats('race'))
                self._ethnicityStats2 = self.make_json_serializable(self._cohort2.get_stats('ethnicity'))
                self._genderDist2 = self.make_json_serializable(self._cohort2.get_distributions('gender'))
                self._ageDist2 = self.make_json_serializable(self._cohort2.get_distributions('age'))
                conds2, self._condHier2 = self._cohort2.get_concept_stats()

                self._conditionsHierarchy = self._condHier1.union(self._condHier2)
            else:
                self._conditionsHierarchy = self._condHier1

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
        if self.isJsonMode:
            # if we are loading from json, just use the file that was loaded
            interesting_conditions = self._conditionsHierarchy
        else:
            # print(f"total node count = {count_all_nodes(self._conditionsHierarchy.get_root_nodes()[0].to_dict())}")
            if not self.is_empty(self._cohort2Metadata):
                # if we are comparing 2 cohorts
                interesting_conditions = self.find_interesting_compare_conditions(1, 2)
            else:
                # if there is just one cohort, use the leaf nodes
                interesting_conditions = self.get_unique_nodes(self._conditionsHierarchy.get_leaf_nodes())

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

        self.create_trait('_conditionsHierarchy', t.List(t.Dict()), interesting_conditions)

        # print("initialization completed")
