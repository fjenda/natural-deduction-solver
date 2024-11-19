<script lang="ts">
  import FormulaInput from "./lib/solver/components/FormulaInput.svelte";
  import PremiseInput from "./lib/solver/components/PremiseInput.svelte";
  import MainLayout from "./lib/layouts/MainLayout.svelte";
  import Panel from "./lib/Panel.svelte";
  import SolverLayout from "./lib/layouts/SolverLayout.svelte";
</script>

<main>
  <MainLayout>
<!--    <Panel>-->
<!--        <h2>Analysis</h2>-->
<!--    </Panel>-->

    <Panel>
        <SolverLayout>
            <PremiseInput placeholder="Premise 1" />
            <PremiseInput placeholder="Premise 2" />
            <FormulaInput />
        </SolverLayout>
    </Panel>

    <Panel>
        <h2>Rules</h2>
    </Panel>
  </MainLayout>
</main>
