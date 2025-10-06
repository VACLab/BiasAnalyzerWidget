# ViewCohorts
ViewCohorts is prototype visualization Python widget developed in JavaScript with AnyWidget. It allows the user to compare two healthcare research cohorts. It is designed to work with BiasAnalyzer (https://github.com/VACLab/BiasAnalyzer). The package and widget together allow healthcare researchers to visualize cohort selection bias in Jupyter Notebooks. With BiasAnalyzer the researcher can define a cohort using inclusion and exclusion criteria, then request aggregate cohort statistics from a data source. The resulting data can then be passed to ViewCohorts to render the visualization. 

## Notebooks:
* demo.ipynb: demos how to connect to the database and run
* demo_json.ipynb: demos how to inject json files as kwargs for faster testing

## Project Directories:
* assets: just ignore this for now, it's stuff I'm looking into
* data: sample json files (for running in demo_json.ipynb)
* yaml: sample yaml files (for running in demo.ipynb)

## Utilities:

The utils folder contains:
* fetch_data_all.ipynb - This is a utility notebook that read each yaml file in a given directory, including subdirectories, gets the data for that file, and outputs the json data to a given output directory. "source_dir" is the path to the read directory. "destination_dir" is the path to the write directory.
* json_store - This is a directory that contains json files for all the sample yaml files that are available in BiasAnalyzer. 

## Usage:
1. Setup a python environment and install BiasAnalyzer
2. Clone or fork ViewCohorts

If using the database:

3. Initializes an instance of the BiasAnalyzer, and connect it to a database storing EHR data standardized to the Observational Medical Outcomes Partnership (OMOP) Common Data Model (CDM).
4. Request one or two cohorts from BiasAnalyzer by providing it the cohort definition in declarative YAML format.
5. Pass the cohort(s) to ViewCohorts for visualization.

If using the json files:

3. Read the json files and pass the json objects to ViewCohorts for visualization.
