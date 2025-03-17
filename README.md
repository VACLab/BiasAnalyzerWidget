# CohortWidget
CohortWidget is prototype visualization Python widget that allows the user to compare two healthcare research cohorts. It is designed to work with BiasAnalyzer (https://github.com/VACLab/BiasAnalyzer). The package and widget together allow healthcare researchers to visualize cohort selection bias in Jupyter Notebooks. With BiasAnalyzer the researcher can define a cohort using inclusion and exclusion criteria, then request aggregate cohort statistics from a data source. The resulting data can then be passed to CohortWidget to render the visualization. 

Usage:
1. Imports BiasAnalyzer and CohortWidget into the Jupyter Notebooks project.
2. Initializes an instance of the BiasAnalyzer, and connect it to a database storing EHR data standardized to the Observational Medical Outcomes Partnership (OMOP) Common Data Model (CDM).
3. Request a cohort from BiasAnalyzer by providing it the cohort definition as SQL or in a declarative YAML format.
4. Statistics returned from BiasAnalyzer are provided to CohortWidget for visualization.
5. Two cohorts can be compared by instantiating CohortAnalyzer with two sets of cohort statistics derived from BiasAnalyzer.
