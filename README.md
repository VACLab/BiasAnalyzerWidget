# CohortViewer
CohortViewer is prototype visualization Python widget developed in JavaScript with AnyWidget. It allows the user to compare two healthcare research cohorts. It is designed to work with BiasAnalyzerCore (https://github.com/VACLab/BiasAnalyzerCore). The package and widget together allow healthcare researchers to visualize cohort selection bias in Jupyter Notebooks. With BiasAnalyzer the researcher can define a cohort using inclusion and exclusion criteria, then request aggregate cohort statistics from a data source. The resulting data can then be passed to CohortViewer to render the visualization. 

## Notebooks:
* demo.ipynb: demos how to connect to the database and run

## Project Directories:
* assets: just ignore this for now, it's stuff I'm looking into
* yaml: sample yaml files (for running in demo.ipynb)

## Usage:
1. Setup a python environment and install BiasAnalyzerCore
2. Clone or fork CohortViewer
3. Initialize an instance of the BiasAnalyzerCore, and connect it to a database storing EHR data standardized to the Observational Medical Outcomes Partnership (OMOP) Common Data Model (CDM).
4. Request one or two cohorts from BiasAnalyzer by providing it the cohort definition in declarative YAML format.
5. Pass the cohort(s) to CohortViewer for visualization.
