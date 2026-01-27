# from statistics import median
import anywidget
import traitlets as t
import pathlib
from datetime import datetime, date
from decimal import Decimal
import numpy as np
import json
# from copy import deepcopy
import time
# from statistics import mode
# from biasanalyzer.background.threading_utils import run_in_background

class CohortViewer(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "index.js"
    _css = pathlib.Path(__file__).parent / "index.css"
    _initialized = t.Bool(default_value=False).tag(sync=True)
    _conditionsHierarchy = None  # class object of the whole tree

    log_debug_info = False  # change to true to write to the debug log
    if log_debug_info:
        log_file = open('./debug.log', 'a', buffering=1)  # Line buffered
    log_timings = False  # change to true to print timings to jupyter

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

    # Communication channels
    request = t.Unicode('').tag(sync=True)
    response = t.Unicode('').tag(sync=True)

    def log(self, message):
        if not self.log_debug_info:
            return
        import datetime
        timestamp = datetime.datetime.now().strftime('%H:%M:%S.%f')[:-3]
        self.log_file.write(f"[{timestamp}] {message}\n")
        self.log_file.flush()

    def log_object_type(self, msg, obj):
        self.log(msg)
        self.log(f"Type: {type(obj)}")
        self.log(f"Type name: {type(obj).__name__}")
        self.log(f"Value: {obj}")

    def create_trait(self, name, trait_type, value):
        if not value is None:
            self.add_traits(**{name: trait_type.tag(sync=True)})
            setattr(self, name, value)

            import json

    def log_tree(self, node, depth=0):
        if not self.log_debug_info:
            return
        indent = "  " * depth
        output = f"{indent}- {json.dumps(node, ensure_ascii=False)}\n"
        # If node is a dict or list, traverse its children
        if isinstance(node, dict):
            for key, value in node.items():
                if isinstance(value, (dict, list)):
                    output += self.log_tree(value, depth + 1)
        elif isinstance(node, list):
            for item in node:
                output += self.log_tree(item, depth + 1)
        self.log(output)

    def _format_elapsed(self, seconds: float) -> str:
        """Return a compact, human-friendly duration string."""
        if seconds < 1e-3:
            return f"{seconds * 1e6:,.0f} µs"
        elif seconds < 1:
            return f"{seconds * 1e3:,.2f} ms"
        elif seconds < 60:
            return f"{seconds:,.2f} s"
        elif seconds < 3600:
            m, s = divmod(seconds, 60)
            return f"{int(m)}m {s:,.2f}s"
        else:
            h, rem = divmod(seconds, 3600)
            m, s = divmod(rem, 60)
            return f"{int(h)}h {int(m)}m {s:,.2f}s"

    def log_time_diff(self, msg, start=None):
        if not self.log_timings or start is None:
            return
        elapsed = time.perf_counter() - start
        print(f" ⏱️ {msg} {self._format_elapsed(elapsed)}")

    def set_time_now(self, msg):
        if not self.log_timings:
            return None
        return time.perf_counter()

    @t.observe('request')
    def _handle_request(self, change):
        """Handle incoming requests from JavaScript"""
        # self.log(f'def _handle_request(self, change): {change}')
        if not change['new']:
            return

        try:
            # self.log(f'try to request data')
            request_data = json.loads(change['new'])
            request_id = request_data.get('id')
            request_type = request_data.get('type')
            params = request_data.get('params', {})

            # Route to appropriate handler
            result = self._process_request(request_type, params)

            # Send response back
            response_data = {
                'id': request_id,
                'type': request_type,
                'data': result,
                'success': True
            }
            self.response = json.dumps(response_data)
            # self.log_format_tree(f'response = {self.response}')

        except Exception as e:
            # self.log(f'error: {e}')
            # Send error response
            response_data = {
                'id': request_data.get('id'),
                'type': request_data.get('type'),
                'error': str(e),
                'success': False
            }
            self.response = json.dumps(response_data)

    def _process_request(self, request_type, params):
        # self.log(f'processing request')
        """Route requests to appropriate handlers"""
        if request_type == 'get_parent_nodes':
            return self._get_parent_nodes(params)
        if request_type == 'get_child_nodes':
            return self._get_child_nodes(params)
        if request_type == 'get_immediate_nodes':
            return self._get_immediate_nodes(params)
        # ... other handlers
        else:
            # self.log(f'Raised ValueError: "Unknown request type: {request_type}"')
            raise ValueError(f"Unknown request type: {request_type}")

    def _get_child_nodes(self, params):
        """Get list of children with first 2 levels of children only"""
        # self.log(f'params: {params}')
        node_id = params.get('node_id')
        result = {'caller_node_id': node_id, 'children': []}
        node = self._conditionsHierarchy.get_node(node_id)

        # self.log(f'node.children: {node.children}')
        for child_node in node.children:
            # self.log(f'child_node: {child_node}')
            child_dict = child_node.to_dict()
            pruned_child = self._prune_tree(child_dict, max_depth=2)
            # self.log(f'pruned_child: ', pruned_child)
            result['children'].append(pruned_child)

        # self.log(f'result: {result}')
        return result

    def _get_parent_nodes(self, params):
        """Get parents with first 2 levels of children only"""
        # self.log(f'params: {params}')
        node_id = params.get('node_id')
        parent_ids = params.get('parent_ids')

        result = {'caller_node_id': node_id, 'parents': []}

        for parent_id in parent_ids:
            parent_node = self._conditionsHierarchy.get_node(parent_id)
            parent_dict = parent_node.to_dict()

            # Prune to 2 levels (parent + 2 child levels)
            pruned_parent = self._prune_tree(parent_dict, max_depth=2)
            result['parents'].append(pruned_parent)

        return result

    def _get_immediate_nodes(self, params):
        # self.log(f'params: {params}')
        caller_node_id = params.get('caller_node_id')
        parent_ids = params.get('parent_ids')
        caller_node = self._conditionsHierarchy.get_node(caller_node_id)
        # self.log(f'caller_node: {caller_node}')
        caller_dict = caller_node.to_dict(include_children = False)
        caller_dict['depth'] = params.get('caller_node_depth')
        # self.log(f'caller_dict: {caller_dict}')

        result = {'caller_node': caller_dict, 'parents': [], 'children': []}

        # self.log(f'parent_ids: {parent_ids}')
        for parent_id in parent_ids:
            parent_node = self._conditionsHierarchy.get_node(parent_id)
            # self.log(f'parent_node: {parent_node}')
            parent_dict = parent_node.to_dict()

            # Prune to 2 levels (parent + 2 child levels)
            pruned_parent = self._prune_tree(parent_dict, max_depth=0)
            # don't drop below 0
            pruned_parent['depth'] = caller_dict['depth'] - 1 if caller_dict['depth'] > 0 else 0
            # self.log(f'pruned_parent_node: {pruned_parent}')

            result['parents'].append(pruned_parent)

        for child_node in caller_node.children:
            # self.log(f'child_node: {child_node}')
            child_dict = child_node.to_dict()
            pruned_child = self._prune_tree(child_dict, max_depth=0)
            pruned_child['depth'] = caller_dict['depth'] + 1
            # self.log(f'pruned_child: ', pruned_child)
            result['children'].append(pruned_child)

        return result

    def _prune_tree(self, node, max_depth=2, current_depth=0):
        """Prune tree to max_depth levels (read-only, no copying needed)"""
        # Fast: just create new dict structure with references
        pruned_node = {k: v for k, v in node.items() if k != 'children'}

        # Check if the original node has children
        has_children_in_full_tree = 'children' in node and node['children'] and len(node['children']) > 0
        pruned_node['hasChildren'] = has_children_in_full_tree

        if current_depth < max_depth and has_children_in_full_tree:
            pruned_node['children'] = [
                self._prune_tree(child, max_depth, current_depth + 1)
                for child in node['children']
            ]
        else:
            pruned_node['children'] = []

        return pruned_node

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
            # bias=None,
            cohort1=None,
            cohort2=None,
            cohort1_shortname='study',
            cohort2_shortname='baseline'
    ):
        # print("=" * 60)  # separator for python console log

        init_start = self.set_time_now("CohortViewer.__init__ started")
        super_start = self.set_time_now("CohortViewer.super().__init__() started")

        super().__init__()
        self.log_time_diff("super().__init__() took ", super_start)

        # READ PARAMETERS

        # end-user parameters
        # self._bias = bias  # NOTE: bias does not need to go to javascript, so no traitlet needed
        self._cohort1 = cohort1
        self._cohort2 = cohort2
        self._cohort1Shortname = cohort1_shortname
        self._cohort2Shortname = cohort2_shortname
        self._initialized = True
        self.log_time_diff("__init__ time taken: ", init_start)

    @t.observe('_initialized')
    def _on_initialized(self, change):
        if change['new']:
            self.on_initialized()

    def on_initialized(self):
        # Perform actions that require the widget to be fully _initialized
        # print("on_initialized called")
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

        def get_node_count(node, cohort_id):
            c = node.get_metrics(cohort_id)
            # if the cohort doesn't exist for this node, then set it to zero
            if not c or 'count' not in c:
                c['count'] = 0
            return c['count']

        def _get_total_count(stats):
            """Safely extract 'total_count' from stats[0]. Returns None if unavailable."""
            if not stats:  # None or empty
                return 0
            first = stats[0]
            if first is None or not isinstance(first, dict):
                return 0
            return first.get('total_count')

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
            count1 = get_node_count(node, cohort_id_1)
            count2 = get_node_count(node, cohort_id_2)
            cohort1_total = _get_total_count(self._cohort1Stats)
            cohort2_total = _get_total_count(self._cohort2Stats)

            if (count1 < cohort1_total * 0.01) or (cohort_id_2 > 0 and count2 < cohort1_total * 0.01):
                return

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
                    add_keep_node(node, depth)  # keep the parent
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
                    children_prevs.append(child.get_metrics(self._cohort1.cohort_id)['prevalence'])
                # need at least 2 values for meaningful variance
                if len(children_prevs) < 2:
                    add_keep_node(node, depth)  # keep the parent
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
        init_widget_start = self.set_time_now("init_widget started")

        t0 = self.set_time_now("\nFetching and serializing cohort 1 metadata ")
        self._cohort1Metadata = self.make_json_serializable(self._cohort1.metadata)
        self.log_time_diff("cohort1 metadata time taken: ", t0)

        t0 = self.set_time_now("\nFetching and serializing cohort 1 stats ")
        self._cohort1Stats = self.make_json_serializable(self._cohort1.get_stats())
        self.log_time_diff("cohort1 stats time taken: ", t0)

        t0 = self.set_time_now("\nFetching and serializing cohort 1 race stats ")
        self._raceStats1 = self.make_json_serializable(self._cohort1.get_stats('race'))
        self.log_time_diff("cohort1 race stats time taken: ", t0)

        t0 = self.set_time_now("\nFetching and serializing cohort 1 ethnicity stats ")
        self._ethnicityStats1 = self.make_json_serializable(self._cohort1.get_stats('ethnicity'))
        self.log_time_diff("cohort1 ethnicity stats time taken: ", t0)

        t0 = self.set_time_now("\nFetching and serializing cohort 1 gender stats ")
        self._genderDist1 = self.make_json_serializable(self._cohort1.get_distributions('gender'))
        self.log_time_diff("cohort1 gender stats time taken: ", t0)

        t0 = self.set_time_now("\nFetching and serializing cohort 1 age stats ")
        self._ageDist1 = self.make_json_serializable(self._cohort1.get_distributions('age'))
        self.log_time_diff("cohort1 age stats time taken: ", t0)

        t0 = self.set_time_now("\nFetching concept stats ")
        cond1, cond_hier1 = self._cohort1.get_concept_stats()
        self.log_time_diff("cohort1 concept stats time taken: ", t0)
        self._conditionsHierarchy = cond_hier1
        # print(f'self._conditionsHierarchy for cohort1 type = {type(self._conditionsHierarchy)}')

        if self._cohort2 is not None:
            t0 = self.set_time_now("\nFetching and serializing cohort 2 metadata ")
            self._cohort2Metadata = self.make_json_serializable(self._cohort2.metadata)
            self.log_time_diff("cohort2 metadata time taken: ", t0)

            t0 = self.set_time_now("\nFetching and serializing cohort 2 stats ")
            self._cohort2Stats = self.make_json_serializable(self._cohort2.get_stats())
            self.log_time_diff("cohort2 stats time taken: ", t0)

            t0 = self.set_time_now("\nFetching and serializing cohort 2 race stats ")
            self._raceStats2 = self.make_json_serializable(self._cohort2.get_stats('race'))
            self.log_time_diff("cohort2 race stats time taken: ", t0)

            t0 = self.set_time_now("\nFetching and serializing cohort 2 ethnicity stats ")
            self._ethnicityStats2 = self.make_json_serializable(self._cohort2.get_stats('ethnicity'))
            self.log_time_diff("cohort2 ethnicity stats time taken: ", t0)

            t0 = self.set_time_now("\nFetching and serializing cohort 2 gender stats ")
            self._genderDist2 = self.make_json_serializable(self._cohort2.get_distributions('gender'))
            self.log_time_diff("cohort2 gender stats time taken: ", t0)

            t0 = self.set_time_now("\nFetching and serializing cohort 2 age stats ")
            self._ageDist2 = self.make_json_serializable(self._cohort2.get_distributions('age'))
            self.log_time_diff("cohort2 age stats time taken: ", t0)

            t0 = self.set_time_now("\nFetching concept stats ")
            cond2, cond_hier2 = self._cohort2.get_concept_stats()
            self.log_time_diff("cohort2 concept stats time taken: ", t0)

            self._conditionsHierarchy = self._conditionsHierarchy.union(cond_hier2)
            # print(f'self._conditionsHierarchy union type = {type(self._conditionsHierarchy)}')
        else:
            self._cohort2Metadata = None
            self._cohort2Stats = None
            self._raceStats2 = None
            self._ethnicityStats2 = None
            self._genderDist2 = None
            self._ageDist2 = None

        # print(f'self._conditionsHierarchy = {self._conditionsHierarchy}')
        # root = self._conditionsHierarchy.get_root_nodes(serialization=True)[0]["node_metrics"][1]['probability']
        # print(f'root = {root}')

        # Give data to traitlets, mostly as lists of dictionaries

        t0 = self.set_time_now("\nPassing data to traitlets ")

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

        if not self.is_empty(self._cohort2):
            # here we are comparing 2 cohorts
            self._interestingConditions = self.find_interesting_conditions(self._cohort1.cohort_id, self._cohort2.cohort_id)
        else:
            # here there is just one cohort
            self._interestingConditions = self.find_interesting_conditions(self._cohort1.cohort_id)

        # print('self._interestingConditions', self._interestingConditions)
        # print(f"interesting_conditions count = {len(self._interestingConditions)}")
        # print(f"interesting_conditions total node count = {count_all_nodes(self._interestingConditions[0])}")

        # self._interesting conditions is a list of dictionaries to pass to javascript
        # this means that self._conditionsHierarchy can stay as a list of nodes
        self.create_trait('_interestingConditions', t.List(t.Dict()),  self._interestingConditions)

        # this is the cohort ids in the order in which thet were passed
        # this is needed because,although a node's source_cohorts lists the cohort ids being used,
        # it does not tell us the order
        self.cohortIds = [self._cohort1.cohort_id]
        if self._cohort2 is not None:
            self.cohortIds.append(self._cohort2.cohort_id)
        self.create_trait('_cohortIds', t.List(),  self.cohortIds)

        # print("initialization completed")
        self.log_time_diff("Data passed to traitlets time taken: ", t0)
        self.log_time_diff("init widget completed", init_widget_start)
